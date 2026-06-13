using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class DocumentAccessLogRepository : IDocumentAccessLogRepository
{
    private readonly SEHubDbContext _context;

    public DocumentAccessLogRepository(SEHubDbContext context) => _context = context;

    public async Task AddAsync(DocumentAccessLog log, CancellationToken cancellationToken = default) =>
        await _context.DocumentAccessLogs.AddAsync(log, cancellationToken);
}
