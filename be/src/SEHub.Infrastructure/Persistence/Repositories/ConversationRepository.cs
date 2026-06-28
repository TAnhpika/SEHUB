using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class ConversationRepository : IConversationRepository
{
    private readonly SEHubDbContext _context;

    public ConversationRepository(SEHubDbContext context) => _context = context;

    public Task<Conversation?> GetByIdAsync(Guid conversationId, CancellationToken cancellationToken = default) =>
        _context.Conversations
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Id == conversationId, cancellationToken);

    public async Task<Guid?> GetDirectConversationIdAsync(
        Guid userId1,
        Guid userId2,
        CancellationToken cancellationToken = default)
    {
        var match = await _context.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.UserId == userId1 || p.UserId == userId2)
            .GroupBy(p => p.ConversationId)
            .Where(g =>
                g.Count() == 2 &&
                g.Any(p => p.UserId == userId1) &&
                g.Any(p => p.UserId == userId2))
            .Select(g => g.Key)
            .FirstOrDefaultAsync(cancellationToken);

        return match == Guid.Empty ? null : match;
    }

    public async Task<Conversation> CreateDirectConversationAsync(
        Guid userId1,
        Guid userId2,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            CreatedAt = now
        };

        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = userId1,
            JoinedAt = now,
            LastReadAt = now
        });

        conversation.Participants.Add(new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = userId2,
            JoinedAt = now,
            LastReadAt = now
        });

        await _context.Conversations.AddAsync(conversation, cancellationToken);
        return conversation;
    }

    public async Task<IReadOnlyList<Conversation>> GetForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var memberships = await _context.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new { p.ConversationId, p.HistoryClearedAt })
            .ToListAsync(cancellationToken);

        if (memberships.Count == 0)
        {
            return Array.Empty<Conversation>();
        }

        var conversationIds = memberships.Select(m => m.ConversationId).ToList();
        var clearedAtByConversation = memberships.ToDictionary(m => m.ConversationId, m => m.HistoryClearedAt);

        var conversations = await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Participants)
            .Where(c => conversationIds.Contains(c.Id))
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .ToListAsync(cancellationToken);

        return conversations
            .Where(conversation =>
            {
                if (!clearedAtByConversation.TryGetValue(conversation.Id, out var clearedAt) || clearedAt is null)
                {
                    return true;
                }

                var lastMessageAt = conversation.LastMessageAt ?? conversation.CreatedAt;
                return lastMessageAt > clearedAt;
            })
            .ToList();
    }

    public Task<ConversationParticipant?> GetParticipantAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        _context.ConversationParticipants.FirstOrDefaultAsync(
            p => p.ConversationId == conversationId && p.UserId == userId,
            cancellationToken);

    public async Task UpdateParticipantLastReadAsync(
        Guid conversationId,
        Guid userId,
        DateTime readAt,
        CancellationToken cancellationToken = default)
    {
        var participant = await GetParticipantAsync(conversationId, userId, cancellationToken)
            ?? throw new InvalidOperationException("Participant not found.");

        participant.LastReadAt = readAt;
    }

    public async Task ClearParticipantHistoryAsync(
        Guid conversationId,
        Guid userId,
        DateTime clearedAt,
        CancellationToken cancellationToken = default)
    {
        var participant = await GetParticipantAsync(conversationId, userId, cancellationToken)
            ?? throw new InvalidOperationException("Participant not found.");

        participant.HistoryClearedAt = clearedAt;
        participant.LastReadAt = clearedAt;
    }

    public async Task UpdateConversationPreviewAsync(
        Guid conversationId,
        string preview,
        DateTime sentAt,
        CancellationToken cancellationToken = default)
    {
        var conversation = await _context.Conversations.FirstOrDefaultAsync(
            c => c.Id == conversationId,
            cancellationToken)
            ?? throw new InvalidOperationException("Conversation not found.");

        conversation.LastMessagePreview = preview.Length > 500 ? preview[..500] : preview;
        conversation.LastMessageAt = sentAt;
        conversation.UpdatedAt = sentAt;
    }

    public async Task<int> GetTotalUnreadCountAsync(
        Guid userId,
        IReadOnlyCollection<Guid>? excludeOtherUserIds = null,
        CancellationToken cancellationToken = default)
    {
        var memberships = await _context.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new { p.ConversationId, p.LastReadAt, p.HistoryClearedAt })
            .ToListAsync(cancellationToken);

        if (memberships.Count == 0)
        {
            return 0;
        }

        HashSet<Guid>? hiddenConversationIds = null;
        if (excludeOtherUserIds is { Count: > 0 })
        {
            var excluded = excludeOtherUserIds.ToHashSet();
            var userConversationIds = memberships.Select(m => m.ConversationId).ToHashSet();
            var hiddenIds = await _context.ConversationParticipants
                .AsNoTracking()
                .Where(p => excluded.Contains(p.UserId) && p.UserId != userId)
                .Where(p => userConversationIds.Contains(p.ConversationId))
                .Select(p => p.ConversationId)
                .ToListAsync(cancellationToken);
            hiddenConversationIds = hiddenIds.ToHashSet();
        }

        var total = 0;
        foreach (var membership in memberships)
        {
            if (hiddenConversationIds?.Contains(membership.ConversationId) == true)
            {
                continue;
            }

            total += await CountUnreadAsync(
                membership.ConversationId,
                userId,
                membership.LastReadAt,
                membership.HistoryClearedAt,
                cancellationToken);
        }

        return total;
    }

    public async Task<int> GetUnreadCountAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var participant = await _context.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.ConversationId == conversationId && p.UserId == userId)
            .Select(p => new { p.LastReadAt, p.HistoryClearedAt })
            .FirstOrDefaultAsync(cancellationToken);

        if (participant is null)
        {
            return 0;
        }

        return await CountUnreadAsync(
            conversationId,
            userId,
            participant.LastReadAt,
            participant.HistoryClearedAt,
            cancellationToken);
    }

    private Task<int> CountUnreadAsync(
        Guid conversationId,
        Guid userId,
        DateTime? lastReadAt,
        DateTime? historyClearedAt,
        CancellationToken cancellationToken)
    {
        var readAt = GetEffectiveReadBoundary(lastReadAt, historyClearedAt);
        return _context.Messages.CountAsync(
            m => m.ConversationId == conversationId &&
                 m.SenderId != userId &&
                 m.SentAt > readAt,
            cancellationToken);
    }

    private static DateTime GetEffectiveReadBoundary(DateTime? lastReadAt, DateTime? historyClearedAt)
    {
        var readAt = lastReadAt ?? DateTime.MinValue;
        if (historyClearedAt.HasValue && historyClearedAt.Value > readAt)
        {
            return historyClearedAt.Value;
        }

        return readAt;
    }

    public Task<bool> IsParticipantAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        _context.ConversationParticipants.AnyAsync(
            p => p.ConversationId == conversationId && p.UserId == userId,
            cancellationToken);
}
