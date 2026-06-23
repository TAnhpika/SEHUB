using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IDocumentCategoryRepository
{
    Task<DocumentCategory?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DocumentCategory?> FindBySubjectCodeAsync(string subjectCode, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<DocumentCategory>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(DocumentCategory category, CancellationToken cancellationToken = default);
}
