using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class ExamRepository : IExamRepository
{
    private readonly SEHubDbContext _context;

    public ExamRepository(SEHubDbContext context) => _context = context;

    public async Task<Exam?> GetByIdAsync(Guid id, bool includeQuestions = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Exams.AsQueryable();
        if (includeQuestions)
        {
            query = query.Include(e => e.Questions).ThenInclude(q => q.Options);
        }

        return await query.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public Task<Exam?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        _context.Exams.FirstOrDefaultAsync(e => e.Code == code, cancellationToken);

    public Task<Exam?> GetByContentHashAsync(string contentHash, CancellationToken cancellationToken = default) =>
        _context.Exams.FirstOrDefaultAsync(e => e.ContentHash == contentHash, cancellationToken);

    public async Task<(IReadOnlyList<Exam> Items, int TotalCount)> GetPagedAsync(ExamQueryParams query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Exams.AsQueryable();

        if (query.IncludeUnpublished)
        {
            if (!string.IsNullOrWhiteSpace(query.Status)
                && Enum.TryParse<ExamStatus>(query.Status, true, out var statusFilter))
            {
                dbQuery = dbQuery.Where(e => e.Status == statusFilter);
            }
        }
        else
        {
            dbQuery = dbQuery.Where(e => e.Status == ExamStatus.Published);
        }

        if (query.SubmittedById is Guid submittedById)
        {
            dbQuery = dbQuery.Where(e => e.SubmittedById == submittedById);
        }

        if (!string.IsNullOrWhiteSpace(query.Type) && Enum.TryParse<ExamType>(query.Type, true, out var examType))
        {
            dbQuery = dbQuery.Where(e => e.ExamType == examType);
        }

        if (!string.IsNullOrWhiteSpace(query.Semester) && int.TryParse(query.Semester, out var semester))
        {
            dbQuery = dbQuery.Where(e => e.Semester == semester);
        }

        if (!string.IsNullOrWhiteSpace(query.Major))
        {
            dbQuery = dbQuery.Where(e => e.Major == query.Major);
        }

        var total = await dbQuery.CountAsync(cancellationToken);
        var items = await dbQuery
            .OrderByDescending(e => e.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task AddAsync(Exam exam, CancellationToken cancellationToken = default) =>
        await _context.Exams.AddAsync(exam, cancellationToken);

    public Task UpdateAsync(Exam exam, CancellationToken cancellationToken = default)
    {
        _context.Exams.Update(exam);
        return Task.CompletedTask;
    }

    public Task<int> CountPublishedAsync(CancellationToken cancellationToken = default) =>
        _context.Exams.CountAsync(e => e.Status == ExamStatus.Published, cancellationToken);
}
