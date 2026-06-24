using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class MessageRepository : IMessageRepository
{
    private readonly SEHubDbContext _context;

    public MessageRepository(SEHubDbContext context) => _context = context;

    public async Task AddAsync(Message message, CancellationToken cancellationToken = default) =>
        await _context.Messages.AddAsync(message, cancellationToken);

    public async Task<IReadOnlyList<Message>> GetPagedAsync(
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _context.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .OrderBy(m => m.SentAt)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountAsync(Guid conversationId, CancellationToken cancellationToken = default) =>
        _context.Messages.CountAsync(m => m.ConversationId == conversationId, cancellationToken);

    public Task<Message?> GetLatestAsync(Guid conversationId, CancellationToken cancellationToken = default) =>
        _context.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.SentAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<Message?> GetByIdAsync(Guid messageId, CancellationToken cancellationToken = default) =>
        _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId, cancellationToken);

    public Task DeleteAsync(Message message, CancellationToken cancellationToken = default)
    {
        _context.Messages.Remove(message);
        return Task.CompletedTask;
    }

    public Task<int> CountSentByUserSinceAsync(
        Guid senderId,
        DateTime sinceUtc,
        CancellationToken cancellationToken = default) =>
        _context.Messages.CountAsync(
            m => m.SenderId == senderId && m.SentAt >= sinceUtc,
            cancellationToken);
}
