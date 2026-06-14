using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Models;
using SEHub.Domain.Exceptions;

namespace SEHub.Infrastructure.Storage;

public sealed class CloudinaryStorageService : IImageCdnStorageService
{
    private readonly CloudinaryOptions _options;
    private readonly ILogger<CloudinaryStorageService> _logger;
    private Cloudinary? _cloudinary;

    public CloudinaryStorageService(IOptions<CloudinaryOptions> options, ILogger<CloudinaryStorageService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public Task<CdnUploadResult> UploadImageAsync(
        Stream stream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default) =>
        UploadInternalAsync(stream, fileName, contentType, folder, ResourceType.Image, cancellationToken);

    public Task<CdnUploadResult> UploadRawAsync(
        Stream stream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default) =>
        UploadInternalAsync(stream, fileName, contentType, folder, ResourceType.Raw, cancellationToken);

    public Task DeleteAsync(string publicId, bool isRaw = false, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publicId))
        {
            return Task.CompletedTask;
        }

        var cloudinary = GetCloudinary();
        var resourceType = isRaw ? ResourceType.Raw : ResourceType.Image;

        try
        {
            cloudinary.Destroy(new DeletionParams(publicId) { ResourceType = resourceType });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete Cloudinary asset {PublicId}", publicId);
        }

        return Task.CompletedTask;
    }

    private Task<CdnUploadResult> UploadInternalAsync(
        Stream stream,
        string fileName,
        string contentType,
        string folder,
        ResourceType resourceType,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var cloudinary = GetCloudinary();
        var safeFolder = SanitizeFolder(folder);
        var assetId = Guid.NewGuid().ToString("N");

        try
        {
            UploadResult result = resourceType == ResourceType.Raw
                ? cloudinary.Upload(new RawUploadParams
                {
                    File = new FileDescription(fileName, stream),
                    Folder = safeFolder,
                    PublicId = assetId,
                    Overwrite = false
                })
                : cloudinary.Upload(new ImageUploadParams
                {
                    File = new FileDescription(fileName, stream),
                    Folder = safeFolder,
                    PublicId = assetId,
                    Overwrite = false
                });

            if (result.Error is not null)
            {
                throw new DomainException($"Cloudinary upload failed: {result.Error.Message}");
            }

            var url = result.SecureUrl?.ToString()
                ?? result.Url?.ToString()
                ?? throw new DomainException("Cloudinary upload returned no URL.");

            return Task.FromResult(new CdnUploadResult
            {
                PublicId = result.PublicId ?? $"{safeFolder}/{assetId}",
                Url = url,
                ContentType = contentType,
                FileSize = result.Bytes
            });
        }
        catch (DomainException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cloudinary upload failed for {FileName}", fileName);
            throw new DomainException("Cloudinary upload failed.", ex);
        }
    }

    private Cloudinary GetCloudinary()
    {
        if (_cloudinary is not null)
        {
            return _cloudinary;
        }

        if (string.IsNullOrWhiteSpace(_options.CloudName)
            || string.IsNullOrWhiteSpace(_options.ApiKey)
            || string.IsNullOrWhiteSpace(_options.ApiSecret))
        {
            throw new DomainException(
                "Cloudinary is not configured. Set Cloudinary:CloudName, ApiKey, and ApiSecret.");
        }

        var account = new Account(_options.CloudName, _options.ApiKey, _options.ApiSecret);
        _cloudinary = new Cloudinary(account) { Api = { Secure = _options.Secure } };
        return _cloudinary;
    }

    private static string SanitizeFolder(string folder) =>
        string.Join('/', folder.Split('/', '\\').Where(part => !string.IsNullOrWhiteSpace(part) && part != ".."));
}
