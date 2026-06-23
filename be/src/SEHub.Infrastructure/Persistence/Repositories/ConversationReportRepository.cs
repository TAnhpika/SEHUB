using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class ConversationReportRepository : IConversationReportRepository
{
    private readonly SEHubDbContext _context;

    public ConversationReportRepository(SEHubDbContext context) => _context = context;

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

    public async Task AddAsync(ConversationReport report, CancellationToken cancellationToken = default) =>
        await _context.ConversationReports.AddAsync(report, cancellationToken);
}
