using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserReportRepository : IUserReportRepository
{
    private readonly SEHubDbContext _context;

    public UserReportRepository(SEHubDbContext context) => _context = context;

    public Task<UserReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.UserReports.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task<UserReport?> GetPendingDuplicateAsync(
        Guid reportedUserId,
        Guid reporterId,
        UserReportSource source,
        Guid? postId,
        Guid? questionCommentId,
        CancellationToken cancellationToken = default) =>
        _context.UserReports.FirstOrDefaultAsync(
            r => r.ReportedUserId == reportedUserId
                 && r.ReporterId == reporterId
                 && r.Source == source
                 && r.PostId == postId
                 && r.QuestionCommentId == questionCommentId
                 && r.Status == ReportStatus.Pending,
            cancellationToken);

    public async Task<(IReadOnlyList<UserReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        ReportStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserReports.AsQueryable();
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

    public Task<int> CountPendingAsync(CancellationToken cancellationToken = default) =>
        _context.UserReports.CountAsync(r => r.Status == ReportStatus.Pending, cancellationToken);

    public async Task AddAsync(UserReport report, CancellationToken cancellationToken = default) =>
        await _context.UserReports.AddAsync(report, cancellationToken);

    public Task UpdateAsync(UserReport report, CancellationToken cancellationToken = default)
    {
        _context.UserReports.Update(report);
        return Task.CompletedTask;
    }
}
