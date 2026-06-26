using SEHub.Application.Abstractions;
using SEHub.Application.Models;
using SEHub.Application.Storage;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Documents;

public static class DocumentFileAccess
{
    public static bool UsesDrive(Document document) =>
        !string.IsNullOrWhiteSpace(document.DriveFileId);

    public static async Task<CloudFileUploadResult> UploadPdfAsync(
        ICloudFileStorageService cloudStorage,
        Stream content,
        string fileName,
        string mimeType,
        long fileSizeBytes,
        CancellationToken cancellationToken)
    {
        CloudFileValidation.EnsureValidPdf(mimeType, fileSizeBytes, fileName);

        try
        {
            return await cloudStorage.UploadAsync(content, fileName, mimeType, cancellationToken);
        }
        catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
        {
            throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
        }
    }

    public static async Task<Stream> OpenReadAsync(
        Document document,
        ICloudFileStorageService cloudStorage,
        CancellationToken cancellationToken)
    {
        if (!UsesDrive(document))
        {
            throw new DomainException(
                "Document is not stored on Google Drive. Run admin migrate-local-to-drive first.");
        }

        try
        {
            var read = await cloudStorage.OpenReadAsync(document.DriveFileId!, cancellationToken);
            return read.Stream;
        }
        catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
        {
            throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
        }
    }

    public static async Task DeleteStoredFileAsync(
        Document document,
        ICloudFileStorageService cloudStorage,
        CancellationToken cancellationToken)
    {
        await CloudFileCleanup.TryDeleteAsync(cloudStorage, document.DriveFileId, cancellationToken);
    }

    public static string ResolveDownloadFileName(Document document)
    {
        if (!string.IsNullOrWhiteSpace(document.OriginalFileName))
        {
            return Path.GetFileName(document.OriginalFileName);
        }

        return BuildDownloadFileName(document.Title, document.MimeType);
    }

    private static string BuildDownloadFileName(string title, string mimeType)
    {
        var extension = mimeType switch
        {
            "application/pdf" => ".pdf",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" => ".pptx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
            _ => string.Empty
        };

        var safeTitle = string.Join('_', title.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
        return string.IsNullOrWhiteSpace(safeTitle) ? $"document{extension}" : $"{safeTitle}{extension}";
    }
}
