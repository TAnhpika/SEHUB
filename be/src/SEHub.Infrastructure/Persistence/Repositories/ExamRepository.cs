using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Exams;
using SEHub.Contracts.Subjects;
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

        return await query
            .Include(e => e.Subject)
            .Include(e => e.RevisionOfExam)
            .ThenInclude(r => r!.Subject)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Exam>> GetByIdsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        return await _context.Exams
            .Include(e => e.Subject)
            .Where(e => ids.Contains(e.Id))
            .ToListAsync(cancellationToken);
    }

    public Task<Exam?> GetByTitleAsync(string paperCode, CancellationToken cancellationToken = default)
    {
        var normalized = paperCode.Trim();
        return _context.Exams
            .Include(e => e.Subject)
            .FirstOrDefaultAsync(
                e => e.Title.ToLower() == normalized.ToLower(),
                cancellationToken);
    }

    public Task<Exam?> GetByContentHashAsync(string contentHash, CancellationToken cancellationToken = default) =>
        _context.Exams.FirstOrDefaultAsync(e => e.ContentHash == contentHash, cancellationToken);

    public async Task<(IReadOnlyList<Exam> Items, int TotalCount)> GetPagedAsync(ExamQueryParams query, CancellationToken cancellationToken = default)
    {
        var dbQuery = _context.Exams
            .Include(e => e.Subject)
            .Include(e => e.RevisionOfExam)
            .AsQueryable();

        if (query.IncludeUnpublished)
        {
            if (!string.IsNullOrWhiteSpace(query.Status)
                && Enum.TryParse<ExamStatus>(query.Status, true, out var statusFilter))
            {
                dbQuery = dbQuery.Where(e => e.Status == statusFilter);
            }
            else
            {
                dbQuery = dbQuery.Where(e => e.Status != ExamStatus.Archived);
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

        if (!string.IsNullOrWhiteSpace(query.Code))
        {
            var subjectCode = query.Code.Trim();
            dbQuery = dbQuery.Where(e => e.Code.ToLower() == subjectCode.ToLower());
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
        var entry = _context.Entry(exam);
        if (entry.State == EntityState.Detached)
        {
            _context.Exams.Update(exam);
        }

        return Task.CompletedTask;
    }

    public async Task ReplaceQuestionsAsync(
        Guid examId,
        IReadOnlyList<Question> newQuestions,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.Questions
            .Where(q => q.ExamId == examId)
            .Include(q => q.Options)
            .ToListAsync(cancellationToken);

        if (existing.Count > 0)
        {
            _context.Questions.RemoveRange(existing);
        }

        if (newQuestions.Count > 0)
        {
            await _context.Questions.AddRangeAsync(newQuestions, cancellationToken);
        }
    }

    public Task<int> CountPublishedAsync(CancellationToken cancellationToken = default) =>
        _context.Exams.CountAsync(e => e.Status == ExamStatus.Published, cancellationToken);

    public Task<Exam?> GetPendingRevisionOfAsync(Guid publishedExamId, CancellationToken cancellationToken = default) =>
        _context.Exams
            .Include(e => e.Questions)
            .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(
                e => e.RevisionOfExamId == publishedExamId && e.Status == ExamStatus.PendingApproval,
                cancellationToken);

    public Task<IReadOnlyList<SubjectSourceEntryDto>> GetDistinctPublishedSubjectsAsync(
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<SubjectSourceEntryDto>>([]);
}
