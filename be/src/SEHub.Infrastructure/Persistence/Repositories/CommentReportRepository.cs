using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class CommentReportRepository : ICommentReportRepository
{
    private readonly SEHubDbContext _context;

    public CommentReportRepository(SEHubDbContext context) => _context = context;

    public Task<CommentReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.CommentReports
            .Include(r => r.Comment)
            .Include(r => r.Post)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task<CommentReport?> GetPendingByCommentAndReporterAsync(
        Guid commentId,
        Guid reporterId,
        CancellationToken cancellationToken = default) =>
        _context.CommentReports.FirstOrDefaultAsync(
            r => r.CommentId == commentId && r.ReporterId == reporterId && r.Status == ReportStatus.Pending,
            cancellationToken);

    public async Task<(IReadOnlyList<CommentReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        ReportStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.CommentReports.AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<CommentReport>> GetRecentAsync(
        int take,
        ReportStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.CommentReports.AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountAsync(ReportStatus? status, CancellationToken cancellationToken = default)
    {
        var query = _context.CommentReports.AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        return query.CountAsync(cancellationToken);
    }

    public async Task AddAsync(CommentReport report, CancellationToken cancellationToken = default) =>
        await _context.CommentReports.AddAsync(report, cancellationToken);

    public Task UpdateAsync(CommentReport report, CancellationToken cancellationToken = default)
    {
        _context.CommentReports.Update(report);
        return Task.CompletedTask;
    }
}
