using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class SubjectRepository : ISubjectRepository
{
    private readonly SEHubDbContext _context;

    public SubjectRepository(SEHubDbContext context) => _context = context;

    public async Task<IReadOnlyList<Subject>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.Subjects
            .OrderBy(s => s.Semester)
            .ThenBy(s => s.DisplayOrder)
            .ThenBy(s => s.Code)
            .ToListAsync(cancellationToken);

    public Task<Subject?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var normalized = code.Trim();
        return _context.Subjects
            .FirstOrDefaultAsync(
                s => s.Code.ToLower() == normalized.ToLower(),
                cancellationToken);
    }
}
