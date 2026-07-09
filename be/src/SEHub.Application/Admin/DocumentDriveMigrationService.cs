using SEHub.Application.Abstractions.Repositories;

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

// Local file migration is deprecated; documents are stored in cloud drive only.
public sealed class DocumentDriveMigrationService : IDocumentDriveMigrationService
{
    public Task<DocumentDriveMigrationResult> MigrateLocalDocumentsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new DocumentDriveMigrationResult
        {
            Errors =
            [
                "Local file migration is no longer supported. Re-upload documents via the admin upload endpoint."
            ]
        });
}
