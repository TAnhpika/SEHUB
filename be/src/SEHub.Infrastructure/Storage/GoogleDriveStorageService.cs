using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Models;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Storage;

public sealed class GoogleDriveStorageService : ICloudFileStorageService
{
    private readonly GoogleDriveOptions _options;
    private readonly ILogger<GoogleDriveStorageService> _logger;
    private DriveService? _driveService;

    public GoogleDriveStorageService(IOptions<GoogleDriveOptions> options, ILogger<GoogleDriveStorageService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<CloudFileUploadResult> UploadAsync(
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var drive = await GetDriveServiceAsync(cancellationToken);
        var safeName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeName))
        {
            throw new DomainException("File name is required.");
        }

        if (stream.CanSeek && stream.Position != 0)
        {
            stream.Position = 0;
        }

        if (string.IsNullOrWhiteSpace(_options.FolderId))
        {
            throw new DomainException(ErrorCodes.StorageNotConfigured);
        }

        _logger.LogInformation(
            "Google Drive upload starting: file={FileName}, parents=[{FolderId}]",
            safeName,
            _options.FolderId);

        var fileMetadata = new Google.Apis.Drive.v3.Data.File
        {
            Name = safeName,
            Parents = new List<string> { _options.FolderId.Trim() }
        };

        var request = drive.Files.Create(fileMetadata, stream, contentType);
        request.Fields = "id,name,mimeType,size";
        request.SupportsAllDrives = true;

        var uploaded = await request.UploadAsync(cancellationToken);
        if (uploaded.Status != Google.Apis.Upload.UploadStatus.Completed)
        {
            _logger.LogError(
                uploaded.Exception,
                "Google Drive upload failed: {Status} folder={FolderId} file={FileName}",
                uploaded.Status,
                _options.FolderId,
                safeName);
            throw new DomainException(BuildUploadFailedMessage(uploaded.Exception));
        }

        var result = request.ResponseBody;
        return new CloudFileUploadResult
        {
            DriveFileId = result.Id,
            OriginalFileName = result.Name ?? safeName,
            ContentType = result.MimeType ?? contentType,
            FileSize = result.Size ?? stream.Length
        };
    }

    public async Task DeleteAsync(string driveFileId, CancellationToken cancellationToken = default)
    {
        var drive = await GetDriveServiceAsync(cancellationToken);
        var request = drive.Files.Delete(driveFileId);
        request.SupportsAllDrives = true;
        await request.ExecuteAsync(cancellationToken);
    }

    public async Task<CloudFileReadResult> OpenReadAsync(string driveFileId, CancellationToken cancellationToken = default)
    {
        var drive = await GetDriveServiceAsync(cancellationToken);

        var metadataRequest = drive.Files.Get(driveFileId);
        metadataRequest.Fields = "id,name,mimeType";
        metadataRequest.SupportsAllDrives = true;
        var metadata = await metadataRequest.ExecuteAsync(cancellationToken);

        var mediaRequest = drive.Files.Get(driveFileId);
        mediaRequest.SupportsAllDrives = true;
        var stream = new MemoryStream();
        await mediaRequest.DownloadAsync(stream, cancellationToken);
        stream.Position = 0;

        return new CloudFileReadResult
        {
            Stream = stream,
            ContentType = metadata.MimeType ?? "application/octet-stream",
            FileName = metadata.Name ?? driveFileId
        };
    }

    private Task<DriveService> GetDriveServiceAsync(CancellationToken cancellationToken)
    {
        if (_driveService is not null)
        {
            return Task.FromResult(_driveService);
        }

        if (string.IsNullOrWhiteSpace(_options.FolderId))
        {
            throw new DomainException(ErrorCodes.StorageNotConfigured);
        }

        cancellationToken.ThrowIfCancellationRequested();

        if (_options.UsesOAuth)
        {
            _logger.LogInformation("Google Drive auth mode: OAuth user token");
            _driveService = GoogleDriveClientFactory.CreateDriveServiceFromOAuth(
                _options.OAuthClientId,
                _options.OAuthClientSecret,
                _options.RefreshToken);
            return Task.FromResult(_driveService);
        }

        if (string.IsNullOrWhiteSpace(_options.ServiceAccountPath))
        {
            throw new DomainException(ErrorCodes.StorageNotConfigured);
        }

        var path = GoogleDriveClientFactory.ResolvePath(_options.ServiceAccountPath);
        if (!File.Exists(path))
        {
            throw new DomainException(ErrorCodes.StorageNotConfigured);
        }

        _logger.LogInformation("Google Drive auth mode: service account");
        _driveService = GoogleDriveClientFactory.CreateDriveServiceFromServiceAccount(path, _options.ImpersonateUser);
        return Task.FromResult(_driveService);
    }

    internal static string BuildUploadFailedMessage(Exception? exception)
    {
        var detail = exception?.Message ?? string.Empty;

        if (detail.Contains("storage quota", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("Service Accounts do not have storage quota", StringComparison.OrdinalIgnoreCase))
        {
            return
                "STORAGE_UPLOAD_FAILED: Folder đang nằm trong My Drive — service account không upload được dù đã share. " +
                "Tạo Shared drive (Ổ dùng chung) → thêm service account (Content manager) → đặt FolderId là folder trong Shared drive đó. " +
                "Hoặc cấu hình GoogleDrive:ImpersonateUser + domain-wide delegation (Workspace admin).";
        }

        if (detail.Contains("insufficient permissions", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("Forbidden", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("403", StringComparison.OrdinalIgnoreCase))
        {
            return
                "STORAGE_UPLOAD_FAILED: Service account chưa có quyền ghi folder. " +
                "Mở folder trên Google Drive → Share → thêm client_email (quyền Editor).";
        }

        if (detail.Contains("not found", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("404", StringComparison.OrdinalIgnoreCase))
        {
            return
                "STORAGE_UPLOAD_FAILED: FolderId không tồn tại hoặc service account không truy cập được folder đó.";
        }

        return string.IsNullOrWhiteSpace(detail)
            ? ErrorCodes.StorageUploadFailed
            : $"{ErrorCodes.StorageUploadFailed}: {detail}";
    }
}
