using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Documents;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Admin;

public interface IDocumentDriveMigrationService
{
    Task<DocumentDriveMigrationResult> MigrateLocalDocumentsAsync(CancellationToken cancellationToken = default);
}

public sealed class DocumentDriveMigrationResult
{
    public int MigratedCount { get; init; }
    public int FailedCount { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];
}

public sealed class DocumentDriveMigrationService : IDocumentDriveMigrationService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IFileStorageService _localStorage;
    private readonly ICloudFileStorageService _cloudStorage;
    private readonly IUnitOfWork _unitOfWork;

    public DocumentDriveMigrationService(
        IDocumentRepository documentRepository,
        IFileStorageService localStorage,
        ICloudFileStorageService cloudStorage,
        IUnitOfWork unitOfWork)
    {
        _documentRepository = documentRepository;
        _localStorage = localStorage;
        _cloudStorage = cloudStorage;
        _unitOfWork = unitOfWork;
    }

    public async Task<DocumentDriveMigrationResult> MigrateLocalDocumentsAsync(CancellationToken cancellationToken = default)
    {
        var documents = await _documentRepository.GetLocalStoredAsync(cancellationToken);
        var migrated = 0;
        var failed = 0;
        var errors = new List<string>();

        foreach (var document in documents)
        {
            try
            {
                await using var stream = await _localStorage.OpenReadAsync(document.FilePath, cancellationToken);
                var fileSizeBytes = stream.CanSeek ? stream.Length : 0;
                if (fileSizeBytes <= 0)
                {
                    throw new InvalidOperationException("Unable to determine local file size.");
                }
                var fileName = !string.IsNullOrWhiteSpace(document.OriginalFileName)
                    ? document.OriginalFileName
                    : Path.GetFileName(document.FilePath);

                var upload = await DocumentFileAccess.UploadPdfAsync(
                    _cloudStorage,
                    stream,
                    fileName,
                    document.MimeType,
                    fileSizeBytes,
                    cancellationToken);

                document.DriveFileId = upload.DriveFileId;
                document.OriginalFileName = upload.OriginalFileName;
                document.FilePath = string.Empty;
                document.UpdatedAt = DateTime.UtcNow;

                await _documentRepository.UpdateAsync(document, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                migrated++;
            }
            catch (Exception ex)
            {
                failed++;
                errors.Add($"{document.Id}: {ex.Message}");
            }
        }

        return new DocumentDriveMigrationResult
        {
            MigratedCount = migrated,
            FailedCount = failed,
            Errors = errors
        };
    }
}
