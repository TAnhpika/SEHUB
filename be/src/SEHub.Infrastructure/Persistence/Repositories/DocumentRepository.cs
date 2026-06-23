using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Documents;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly SEHubDbContext _context;

    public DocumentRepository(SEHubDbContext context) => _context = context;

    public Task<Document?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.Documents.Include(d => d.Category).FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<Document> Items, int TotalCount)> GetPagedAsync(
        DocumentQueryParams query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Documents.Include(d => d.Category).AsQueryable();

        if (query.CategoryId.HasValue)
        {
            dbQuery = dbQuery.Where(d => d.CategoryId == query.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Semester) && int.TryParse(query.Semester, out var semester))
        {
            dbQuery = dbQuery.Where(d => d.Category.Semester == semester);
        }

        if (!string.IsNullOrWhiteSpace(query.Major))
        {
            dbQuery = dbQuery.Where(d => d.Category.Major == query.Major);
        }

        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await dbQuery
            .OrderByDescending(d => d.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task AddAsync(Document document, CancellationToken cancellationToken = default) =>
        await _context.Documents.AddAsync(document, cancellationToken);

    public Task UpdateAsync(Document document, CancellationToken cancellationToken = default)
    {
        _context.Documents.Update(document);
        return Task.CompletedTask;
    }

    public Task SoftDeleteAsync(Document document, Guid deletedById, CancellationToken cancellationToken = default)
    {
        document.IsDeleted = true;
        document.DeletedAt = DateTime.UtcNow;
        document.DeletedById = deletedById;
        _context.Documents.Update(document);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<Document>> GetLocalStoredAsync(CancellationToken cancellationToken = default) =>
        await _context.Documents
            .Where(d => !d.IsDeleted
                && (d.DriveFileId == null || d.DriveFileId == string.Empty)
                && d.FilePath != string.Empty)
            .OrderBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<int> CountAsync(CancellationToken cancellationToken = default) =>
        _context.Documents.CountAsync(cancellationToken);
}
