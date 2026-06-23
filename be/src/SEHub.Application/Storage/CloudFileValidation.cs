using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Storage;

public static class CloudFileValidation
{
    public const long MaxPdfSizeBytes = 20 * 1024 * 1024;
    public const long MaxExamAttachmentSizeBytes = 50 * 1024 * 1024;
    public const long MaxImageSizeBytes = 10 * 1024 * 1024;

    private static readonly HashSet<string> PdfContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf"
    };

    private static readonly HashSet<string> ExamAttachmentContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/zip",
        "application/x-zip-compressed",
        "application/vnd.rar",
        "application/x-rar-compressed",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream"
    };

    private static readonly HashSet<string> ExamAttachmentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".zip", ".rar", ".docx"
    };

    private static readonly HashSet<string> ImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    };

    public static void EnsureValidPdf(string contentType, long fileSizeBytes, string fileName)
    {
        EnsureFileName(fileName);
        EnsureSize(fileSizeBytes, MaxPdfSizeBytes);
        if (!PdfContentTypes.Contains(contentType?.Trim() ?? string.Empty))
        {
            throw new DomainException(ErrorCodes.InvalidFileType);
        }
    }

    public static void EnsureValidExamAttachment(string contentType, long fileSizeBytes, string fileName)
    {
        EnsureFileName(fileName);
        EnsureSize(fileSizeBytes, MaxExamAttachmentSizeBytes);

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(extension) || !ExamAttachmentExtensions.Contains(extension))
        {
            throw new DomainException(ErrorCodes.InvalidFileType);
        }

        var normalizedContentType = contentType?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(normalizedContentType)
            || normalizedContentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!ExamAttachmentContentTypes.Contains(normalizedContentType))
        {
            throw new DomainException(ErrorCodes.InvalidFileType);
        }
    }

    public static void EnsureValidImage(string contentType, long fileSizeBytes, string fileName)
    {
        EnsureFileName(fileName);
        EnsureSize(fileSizeBytes, MaxImageSizeBytes);
        if (!ImageContentTypes.Contains(contentType?.Trim() ?? string.Empty))
        {
            throw new DomainException(ErrorCodes.InvalidFileType);
        }
    }

    private static void EnsureSize(long fileSizeBytes, long maxBytes)
    {
        if (fileSizeBytes <= 0)
        {
            throw new DomainException("File is required.");
        }

        if (fileSizeBytes > maxBytes)
        {
            throw new DomainException(ErrorCodes.FileTooLarge);
        }
    }

    private static void EnsureFileName(string fileName)
    {
        if (string.IsNullOrWhiteSpace(Path.GetFileName(fileName)))
        {
            throw new DomainException("File name is required.");
        }
    }
}
