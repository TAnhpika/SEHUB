using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class PostReportRepository : IPostReportRepository
{
    private readonly SEHubDbContext _context;

    public PostReportRepository(SEHubDbContext context) => _context = context;

    public Task<PostReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.PostReports.Include(r => r.Post).FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task<PostReport?> GetPendingByPostAndReporterAsync(Guid postId, Guid reporterId, CancellationToken cancellationToken = default) =>
        _context.PostReports.FirstOrDefaultAsync(
            r => r.PostId == postId && r.ReporterId == reporterId && r.Status == ReportStatus.Pending,
            cancellationToken);

    public async Task<(IReadOnlyList<PostReport> Items, int TotalCount)> GetPagedAsync(
        int page, int pageSize, ReportStatus? status, CancellationToken cancellationToken = default)
    {
        var query = _context.PostReports.Include(r => r.Post).AsQueryable();
        if (status.HasValue) query = query.Where(r => r.Status == status.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task AddAsync(PostReport report, CancellationToken cancellationToken = default) =>
        await _context.PostReports.AddAsync(report, cancellationToken);

    public Task UpdateAsync(PostReport report, CancellationToken cancellationToken = default)
    {
        _context.PostReports.Update(report);
        return Task.CompletedTask;
    }
}
