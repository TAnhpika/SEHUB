using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class ConversationReportRepository : IConversationReportRepository
{
    private readonly SEHubDbContext _context;

    public ConversationReportRepository(SEHubDbContext context) => _context = context;

    public Task<ConversationReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.ConversationReports
            .Include(r => r.Conversation)
            .ThenInclude(c => c.Participants)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task<ConversationReport?> GetPendingByConversationAndReporterAsync(
        Guid conversationId,
        Guid reporterId,
        CancellationToken cancellationToken = default) =>
        _context.ConversationReports.FirstOrDefaultAsync(
            r =>
                r.ConversationId == conversationId &&
                r.ReporterId == reporterId &&
                r.Status == ReportStatus.Pending,
            cancellationToken);

    public async Task<(IReadOnlyList<ConversationReport> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        ReportStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.ConversationReports
            .AsNoTracking()
            .Include(r => r.Conversation)
            .ThenInclude(c => c.Participants)
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
        _context.ConversationReports.CountAsync(r => r.Status == ReportStatus.Pending, cancellationToken);

    public async Task AddAsync(ConversationReport report, CancellationToken cancellationToken = default) =>
        await _context.ConversationReports.AddAsync(report, cancellationToken);

    public Task UpdateAsync(ConversationReport report, CancellationToken cancellationToken = default)
    {
        _context.ConversationReports.Update(report);
        return Task.CompletedTask;
    }
}
