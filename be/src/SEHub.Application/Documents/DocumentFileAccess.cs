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
        IFileStorageService localStorage,
        ICloudFileStorageService cloudStorage,
        CancellationToken cancellationToken)
    {
        if (UsesDrive(document))
        {
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

        if (string.IsNullOrWhiteSpace(document.FilePath))
        {
            throw new FileNotFoundException("Document file not found.");
        }

        return await localStorage.OpenReadAsync(document.FilePath, cancellationToken);
    }

    public static async Task DeleteStoredFileAsync(
        Document document,
        IFileStorageService localStorage,
        ICloudFileStorageService cloudStorage,
        CancellationToken cancellationToken)
    {
        if (UsesDrive(document))
        {
            try
            {
                await cloudStorage.DeleteAsync(document.DriveFileId!, cancellationToken);
            }
            catch
            {
                /* best effort */
            }

            return;
        }

        if (string.IsNullOrWhiteSpace(document.FilePath))
        {
            return;
        }

        try
        {
            await localStorage.DeleteAsync(document.FilePath, cancellationToken);
        }
        catch (FileNotFoundException)
        {
            /* already removed */
        }
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
