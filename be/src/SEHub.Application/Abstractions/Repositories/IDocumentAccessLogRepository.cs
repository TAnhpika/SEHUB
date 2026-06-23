using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IDocumentAccessLogRepository
{
    Task AddAsync(DocumentAccessLog log, CancellationToken cancellationToken = default);
}
