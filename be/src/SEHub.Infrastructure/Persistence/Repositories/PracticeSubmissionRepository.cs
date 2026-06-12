using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PracticeSubmissionRepository : IPracticeSubmissionRepository
{
    private readonly SEHubDbContext _context;

    public PracticeSubmissionRepository(SEHubDbContext context) => _context = context;

    public Task<PracticeSubmission?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.PracticeSubmissions.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public Task<PracticeSubmission?> GetLatestByUserAndExamAsync(Guid userId, Guid examId, CancellationToken cancellationToken = default) =>
        _context.PracticeSubmissions.FirstOrDefaultAsync(
            s => s.UserId == userId && s.ExamId == examId && s.IsLatest,
            cancellationToken);

    public async Task<(IReadOnlyList<PracticeSubmission> Items, int TotalCount)> GetPagedByExamAsync(
        Guid examId, int page, int pageSize, PracticeSubmissionStatus? status, CancellationToken cancellationToken = default)
    {
        var query = _context.PracticeSubmissions.Where(s => s.ExamId == examId && s.IsLatest);
        if (status.HasValue) query = query.Where(s => s.Status == status.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<(IReadOnlyList<PracticeSubmission> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, PracticeSubmissionStatus? status, CancellationToken cancellationToken = default)
    {
        var query = _context.PracticeSubmissions.Where(s => s.IsLatest);
        if (status.HasValue)
        {
            query = query.Where(s => s.Status == status.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<int> CountByStatusAsync(PracticeSubmissionStatus status, CancellationToken cancellationToken = default) =>
        _context.PracticeSubmissions.CountAsync(
            s => s.IsLatest && s.Status == status,
            cancellationToken);

    public async Task AddAsync(PracticeSubmission submission, CancellationToken cancellationToken = default) =>
        await _context.PracticeSubmissions.AddAsync(submission, cancellationToken);

    public Task UpdateAsync(PracticeSubmission submission, CancellationToken cancellationToken = default)
    {
        _context.PracticeSubmissions.Update(submission);
        return Task.CompletedTask;
    }

    public async Task MarkPreviousAsNotLatestAsync(Guid userId, Guid examId, CancellationToken cancellationToken = default)
    {
        var previous = await _context.PracticeSubmissions
            .Where(s => s.UserId == userId && s.ExamId == examId && s.IsLatest)
            .ToListAsync(cancellationToken);
        foreach (var item in previous) item.IsLatest = false;
    }
}
