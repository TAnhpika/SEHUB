using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class ExamAttemptRepository : IExamAttemptRepository
{
    private readonly SEHubDbContext _context;

    public ExamAttemptRepository(SEHubDbContext context) => _context = context;

    public Task<ExamAttempt?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.ExamAttempts.Include(a => a.Exam).FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public Task<ExamAttempt?> GetActiveAsync(Guid userId, Guid examId, CancellationToken cancellationToken = default) =>
        _context.ExamAttempts.FirstOrDefaultAsync(
            a => a.UserId == userId && a.ExamId == examId && a.Status == ExamAttemptStatus.InProgress,
            cancellationToken);

    public async Task AddAsync(ExamAttempt attempt, CancellationToken cancellationToken = default) =>
        await _context.ExamAttempts.AddAsync(attempt, cancellationToken);

    public Task UpdateAsync(ExamAttempt attempt, CancellationToken cancellationToken = default)
    {
        _context.ExamAttempts.Update(attempt);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<ExamAttempt>> GetByUserAndExamAsync(
        Guid userId, Guid examId, ExamAttemptStatus? status, CancellationToken cancellationToken = default)
    {
        var query = _context.ExamAttempts.Where(a => a.UserId == userId && a.ExamId == examId);
        if (status.HasValue) query = query.Where(a => a.Status == status.Value);
        return await query.OrderByDescending(a => a.StartedAt).ToListAsync(cancellationToken);
    }

    public Task<int> CountSubmittedByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.ExamAttempts.CountAsync(
            a => a.UserId == userId && a.Status == ExamAttemptStatus.Submitted,
            cancellationToken);

    public Task<int> CountSubmittedWithMinScoreAsync(Guid userId, decimal minScore, CancellationToken cancellationToken = default) =>
        _context.ExamAttempts.CountAsync(
            a => a.UserId == userId &&
                 a.Status == ExamAttemptStatus.Submitted &&
                 a.Score.HasValue &&
                 a.Score.Value >= minScore,
            cancellationToken);

    public async Task<(IReadOnlyList<ExamAttempt> Items, int TotalCount)> GetSubmittedFinalPagedByUserIdAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ExamAttempts
            .AsNoTracking()
            .Include(a => a.Exam)
            .Where(a =>
                a.UserId == userId &&
                a.Status == ExamAttemptStatus.Submitted &&
                a.Exam.ExamType == ExamType.Final);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.SubmittedAt ?? a.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
