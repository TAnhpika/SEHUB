using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class DocumentCategoryRepository : IDocumentCategoryRepository
{
    private readonly SEHubDbContext _context;

    public DocumentCategoryRepository(SEHubDbContext context) => _context = context;

    public Task<DocumentCategory?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.DocumentCategories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public Task<DocumentCategory?> FindBySubjectCodeAsync(string subjectCode, CancellationToken cancellationToken = default)
    {
        var normalized = subjectCode.Trim();
        return _context.DocumentCategories
            .FirstOrDefaultAsync(
                c => (c.SubjectCode != null && c.SubjectCode.ToLower() == normalized.ToLower())
                    || c.Name.StartsWith(normalized + " ", StringComparison.OrdinalIgnoreCase)
                    || c.Name.StartsWith(normalized + "-", StringComparison.OrdinalIgnoreCase),
                cancellationToken);
    }

    public async Task<IReadOnlyList<DocumentCategory>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.DocumentCategories
            .OrderBy(c => c.Semester)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(DocumentCategory category, CancellationToken cancellationToken = default)
    {
        await _context.DocumentCategories.AddAsync(category, cancellationToken);
    }
}
