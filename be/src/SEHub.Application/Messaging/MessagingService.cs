using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Messaging;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Messaging;

public sealed class MessagingService : IMessagingService
{
    private const int MaxPageSize = 100;
    private const int MaxContentLength = 4000;

    private readonly IConversationRepository _conversationRepository;
    private readonly IMessageRepository _messageRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserSearchRepository _searchRepository;
    private readonly IChatNotifier _chatNotifier;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public MessagingService(
        IConversationRepository conversationRepository,
        IMessageRepository messageRepository,
        IUserRepository userRepository,
        IUserSearchRepository searchRepository,
        IChatNotifier chatNotifier,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
        _userRepository = userRepository;
        _searchRepository = searchRepository;
        _chatNotifier = chatNotifier;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ConversationListItemDto>> GetConversationsAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var conversations = await _conversationRepository.GetForUserAsync(userId, cancellationToken);
        var items = new List<ConversationListItemDto>();

        foreach (var conversation in conversations)
        {
            items.Add(await MapConversationAsync(conversation, userId, cancellationToken));
        }

        return items;
    }

    public async Task<ConversationListItemDto> GetOrCreateDirectConversationAsync(
        Guid otherUserId,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureUserExistsAsync(otherUserId, cancellationToken);

        if (userId == otherUserId)
        {
            throw new DomainException("You cannot start a conversation with yourself.");
        }

        var existingId = await _conversationRepository.GetDirectConversationIdAsync(userId, otherUserId, cancellationToken);
        Conversation conversation;

        if (existingId.HasValue)
        {
            conversation = await _conversationRepository.GetByIdAsync(existingId.Value, cancellationToken)
                ?? throw new NotFoundException("Conversation", existingId.Value);
        }
        else
        {
            conversation = await _conversationRepository.CreateDirectConversationAsync(userId, otherUserId, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return await MapConversationAsync(conversation, userId, cancellationToken);
    }

    public async Task<PagedResult<MessageDto>> GetMessagesAsync(
        Guid conversationId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureParticipantAsync(conversationId, userId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var total = await _messageRepository.CountAsync(conversationId, cancellationToken);
        var messages = await _messageRepository.GetPagedAsync(conversationId, page, pageSize, cancellationToken);

        return new PagedResult<MessageDto>
        {
            Items = messages.Select(m => MapMessage(m, userId)).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<MessageDto> SendMessageAsync(
        Guid conversationId,
        string content,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureParticipantAsync(conversationId, userId, cancellationToken);

        var trimmed = content.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new DomainException("Message content is required.");
        }

        if (trimmed.Length > MaxContentLength)
        {
            throw new DomainException($"Message content cannot exceed {MaxContentLength} characters.");
        }

        var now = DateTime.UtcNow;
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = userId,
            Content = trimmed,
            SentAt = now,
            CreatedAt = now
        };

        await _messageRepository.AddAsync(message, cancellationToken);
        await _conversationRepository.UpdateConversationPreviewAsync(conversationId, trimmed, now, cancellationToken);

        var participant = await _conversationRepository.GetParticipantAsync(conversationId, userId, cancellationToken);
        if (participant is not null)
        {
            participant.LastReadAt = now;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = MapMessage(message, userId);
        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken)
            ?? throw new NotFoundException("Conversation", conversationId);
        var participantIds = conversation.Participants.Select(p => p.UserId).ToList();

        await _chatNotifier.NotifyMessageReceivedAsync(dto, participantIds, cancellationToken);

        foreach (var participantId in participantIds)
        {
            var unread = await _conversationRepository.GetTotalUnreadCountAsync(participantId, cancellationToken);
            await _chatNotifier.NotifyUnreadCountUpdatedAsync(participantId, unread, cancellationToken);
        }

        return dto;
    }

    public async Task MarkReadAsync(Guid conversationId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureParticipantAsync(conversationId, userId, cancellationToken);

        var now = DateTime.UtcNow;
        await _conversationRepository.UpdateParticipantLastReadAsync(conversationId, userId, now, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var unread = await _conversationRepository.GetTotalUnreadCountAsync(userId, cancellationToken);
        await _chatNotifier.NotifyUnreadCountUpdatedAsync(userId, unread, cancellationToken);
    }

    public async Task<UnreadCountDto> GetUnreadCountAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var total = await _conversationRepository.GetTotalUnreadCountAsync(userId, cancellationToken);
        return new UnreadCountDto { TotalUnread = total };
    }

    private async Task<ConversationListItemDto> MapConversationAsync(
        Conversation conversation,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var otherParticipant = conversation.Participants.FirstOrDefault(p => p.UserId != currentUserId)
            ?? conversation.Participants.FirstOrDefault()
            ?? throw new InvalidOperationException("Conversation has no participants.");

        var summaries = await _searchRepository.GetByIdsAsync([otherParticipant.UserId], cancellationToken);
        var other = summaries.FirstOrDefault();
        var unread = await _conversationRepository.GetUnreadCountAsync(
            conversation.Id,
            currentUserId,
            cancellationToken);

        return new ConversationListItemDto
        {
            ConversationId = conversation.Id,
            OtherUserId = otherParticipant.UserId,
            OtherUsername = other?.Username ?? string.Empty,
            OtherFullName = other?.FullName ?? string.Empty,
            OtherAvatarUrl = other?.AvatarUrl,
            LastMessagePreview = conversation.LastMessagePreview,
            LastMessageAt = conversation.LastMessageAt,
            UnreadCount = unread
        };
    }

    private static MessageDto MapMessage(Message message, Guid currentUserId) =>
        new()
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            Content = message.Content,
            SentAt = message.SentAt,
            IsMine = message.SenderId == currentUserId
        };

    private async Task EnsureParticipantAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (!await _conversationRepository.IsParticipantAsync(conversationId, userId, cancellationToken))
        {
            throw new ForbiddenException("You are not a participant in this conversation.");
        }
    }

    private async Task EnsureUserExistsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null || user.IsBanned)
        {
            throw new NotFoundException("User", userId);
        }
    }
}
