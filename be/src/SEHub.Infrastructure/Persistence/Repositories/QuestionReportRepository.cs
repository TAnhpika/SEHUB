using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class QuestionReportRepository : IQuestionReportRepository
{
    private readonly SEHubDbContext _context;

    public QuestionReportRepository(SEHubDbContext context) => _context = context;

    public Task<QuestionReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.QuestionReports
            .Include(r => r.Question)
            .ThenInclude(q => q.Options)
            .Include(r => r.Exam)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task<QuestionReport?> GetPendingByQuestionAndReporterAsync(
        Guid questionId,
        Guid reporterId,
        CancellationToken cancellationToken = default) =>
        _context.QuestionReports.FirstOrDefaultAsync(
            r => r.QuestionId == questionId
                 && r.ReporterId == reporterId
                 && r.Status == ReportStatus.Pending,
            cancellationToken);

    public async Task<(IReadOnlyList<QuestionReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        ReportStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.QuestionReports
            .AsNoTracking()
            .Include(r => r.Question)
            .ThenInclude(q => q.Options)
            .Include(r => r.Exam)
            .AsQueryable();

        if (status is ReportStatus statusFilter)
        {
            query = query.Where(r => r.Status == statusFilter);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<int> CountPendingAsync(CancellationToken cancellationToken = default) =>
        _context.QuestionReports.CountAsync(r => r.Status == ReportStatus.Pending, cancellationToken);

    public async Task AddAsync(QuestionReport report, CancellationToken cancellationToken = default) =>
        await _context.QuestionReports.AddAsync(report, cancellationToken);

    public Task UpdateAsync(QuestionReport report, CancellationToken cancellationToken = default)
    {
        _context.QuestionReports.Update(report);
        return Task.CompletedTask;
    }
}
