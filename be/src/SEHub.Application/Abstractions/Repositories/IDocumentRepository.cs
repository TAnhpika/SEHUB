using SEHub.Contracts.Documents;
using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IDocumentRepository
{
    Task<Document?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<Document> Items, int TotalCount)> GetPagedAsync(DocumentQueryParams query, CancellationToken cancellationToken = default);
    Task AddAsync(Document document, CancellationToken cancellationToken = default);
    Task UpdateAsync(Document document, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(Document document, Guid deletedById, CancellationToken cancellationToken = default);
    Task<int> CountAsync(CancellationToken cancellationToken = default);
}
