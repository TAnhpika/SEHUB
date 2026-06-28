using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Notifications;
using SEHub.Application.Storage;
using SEHub.Contracts.Common;
using SEHub.Contracts.Messaging;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Messaging;

public sealed class MessagingService : IMessagingService
{
    private const int MaxPageSize = 100;
    private const int MaxContentLength = 4000;
    private const int MaxMessagesPerMinute = 30;
    private const long MaxImageSizeBytes = 5 * 1024 * 1024;
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    private static readonly HashSet<string> AllowedImageMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    };

    private static readonly HashSet<string> AllowedFileMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
        "text/plain"
    };

    private readonly IConversationRepository _conversationRepository;
    private readonly IMessageRepository _messageRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserSearchRepository _searchRepository;
    private readonly IUserBlockRepository _blockRepository;
    private readonly INotificationService _notificationService;
    private readonly IChatNotifier _chatNotifier;
    private readonly IUserPresenceService _presenceService;
    private readonly IFileStorageService _fileStorage;
    private readonly IImageCdnStorageService _cdnStorage;
    private readonly ICdnFolderSettings _cdnFolders;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public MessagingService(
        IConversationRepository conversationRepository,
        IMessageRepository messageRepository,
        IUserRepository userRepository,
        IUserSearchRepository searchRepository,
        IUserBlockRepository blockRepository,
        INotificationService notificationService,
        IChatNotifier chatNotifier,
        IUserPresenceService presenceService,
        IFileStorageService fileStorage,
        IImageCdnStorageService cdnStorage,
        ICdnFolderSettings cdnFolders,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
        _userRepository = userRepository;
        _searchRepository = searchRepository;
        _blockRepository = blockRepository;
        _notificationService = notificationService;
        _chatNotifier = chatNotifier;
        _presenceService = presenceService;
        _fileStorage = fileStorage;
        _cdnStorage = cdnStorage;
        _cdnFolders = cdnFolders;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<ConversationListItemDto>> GetConversationsAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var blockedUserIds = await _blockRepository.GetBlockedRelatedUserIdsAsync(userId, cancellationToken);
        var conversations = await _conversationRepository.GetForUserAsync(userId, cancellationToken);
        var items = new List<ConversationListItemDto>();

        foreach (var conversation in conversations)
        {
            var otherParticipant = conversation.Participants.FirstOrDefault(p => p.UserId != userId);
            if (otherParticipant is not null && blockedUserIds.Contains(otherParticipant.UserId))
            {
                continue;
            }

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

        if (await _blockRepository.IsBlockedEitherWayAsync(userId, otherUserId, cancellationToken))
        {
            throw new UserBlockedException();
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
            Items = (await Task.WhenAll(messages.Select(m => MapMessageAsync(m, userId, cancellationToken)))).ToList(),
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
        await EnsureNotBlockedInConversationAsync(conversationId, userId, cancellationToken);
        await EnsureWithinRateLimitAsync(userId, cancellationToken);

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
            MessageType = MessageType.Text,
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

        return await NotifyMessageSentAsync(message, userId, trimmed, cancellationToken);
    }

    public async Task<MessageDto> SendAttachmentMessageAsync(
        Guid conversationId,
        Stream fileContent,
        string fileName,
        string mimeType,
        long fileSizeBytes,
        string? caption,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureParticipantAsync(conversationId, userId, cancellationToken);
        await EnsureNotBlockedInConversationAsync(conversationId, userId, cancellationToken);
        await EnsureWithinRateLimitAsync(userId, cancellationToken);

        var normalizedMimeType = string.IsNullOrWhiteSpace(mimeType) ? "application/octet-stream" : mimeType.Trim();
        var messageType = ResolveAttachmentMessageType(normalizedMimeType);
        EnsureAttachmentAllowed(normalizedMimeType, messageType);
        var maxSize = messageType == MessageType.Image ? MaxImageSizeBytes : MaxFileSizeBytes;

        if (fileSizeBytes <= 0)
        {
            throw new DomainException("File is required.");
        }

        if (fileSizeBytes > maxSize)
        {
            throw new DomainException(
                messageType == MessageType.Image
                    ? "Image size cannot exceed 5 MB."
                    : "File size cannot exceed 10 MB.");
        }

        var trimmedCaption = caption?.Trim() ?? string.Empty;
        if (trimmedCaption.Length > MaxContentLength)
        {
            throw new DomainException($"Caption cannot exceed {MaxContentLength} characters.");
        }

        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            throw new DomainException("File name is required.");
        }

        var upload = messageType == MessageType.Image
            ? await _cdnStorage.UploadImageAsync(
                fileContent,
                safeFileName,
                normalizedMimeType,
                _cdnFolders.Chat,
                cancellationToken)
            : await _cdnStorage.UploadRawAsync(
                fileContent,
                safeFileName,
                normalizedMimeType,
                _cdnFolders.Chat,
                cancellationToken);

        var now = DateTime.UtcNow;
        var preview = BuildAttachmentPreview(messageType, trimmedCaption, safeFileName);
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = userId,
            Content = trimmedCaption,
            MessageType = messageType,
            AttachmentPath = upload.Url,
            AttachmentPublicId = upload.PublicId,
            AttachmentFileName = safeFileName,
            AttachmentMimeType = normalizedMimeType,
            AttachmentSizeBytes = fileSizeBytes,
            SentAt = now,
            CreatedAt = now
        };

        await _messageRepository.AddAsync(message, cancellationToken);
        await _conversationRepository.UpdateConversationPreviewAsync(conversationId, preview, now, cancellationToken);

        var participant = await _conversationRepository.GetParticipantAsync(conversationId, userId, cancellationToken);
        if (participant is not null)
        {
            participant.LastReadAt = now;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await NotifyMessageSentAsync(message, userId, preview, cancellationToken);
    }

    private async Task<MessageDto> NotifyMessageSentAsync(
        Message message,
        Guid userId,
        string preview,
        CancellationToken cancellationToken)
    {
        var dto = await MapMessageAsync(message, userId, cancellationToken);
        var conversationId = message.ConversationId;
        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken)
            ?? throw new NotFoundException("Conversation", conversationId);
        var participantIds = conversation.Participants.Select(p => p.UserId).ToList();

        await _chatNotifier.NotifyMessageReceivedAsync(dto, participantIds, cancellationToken);

        foreach (var participantId in participantIds)
        {
            var unread = await _conversationRepository.GetTotalUnreadCountAsync(participantId, cancellationToken);
            await _chatNotifier.NotifyUnreadCountUpdatedAsync(participantId, unread, cancellationToken);
        }

        var recipientId = participantIds.FirstOrDefault(id => id != userId);
        if (recipientId != Guid.Empty)
        {
            var senderSummary = (await _searchRepository.GetByIdsAsync([userId], cancellationToken)).FirstOrDefault();
            var senderName = senderSummary?.FullName ?? senderSummary?.Username ?? "Ai đó";
            var notificationPreview = preview.Length > 80 ? $"{preview[..77]}..." : preview;

            await _notificationService.CreateAsync(
                recipientId,
                NotificationType.Message,
                $"{senderName} đã gửi tin nhắn cho bạn",
                notificationPreview,
                $"/home/messages?conversation={conversationId}",
                userId,
                conversationId,
                cancellationToken);
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

    public async Task DeleteMessageAsync(Guid conversationId, Guid messageId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureParticipantAsync(conversationId, userId, cancellationToken);

        var message = await _messageRepository.GetByIdAsync(messageId, cancellationToken)
            ?? throw new NotFoundException("Message", messageId);

        if (message.ConversationId != conversationId)
        {
            throw new NotFoundException("Message", messageId);
        }

        if (message.SenderId != userId && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("You can only delete your own messages.");
        }

        var isRawAttachment = message.MessageType == MessageType.File;
        await CdnAssetCleanup.TryDeleteAsync(
            _cdnStorage,
            message.AttachmentPublicId,
            message.AttachmentPath,
            isRawAttachment,
            cancellationToken);

        await _messageRepository.DeleteAsync(message, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
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
        var presence = await _presenceService.GetSnapshotAsync(otherParticipant.UserId, cancellationToken);

        return new ConversationListItemDto
        {
            ConversationId = conversation.Id,
            OtherUserId = otherParticipant.UserId,
            OtherUsername = other?.Username ?? string.Empty,
            OtherFullName = other?.FullName ?? string.Empty,
            OtherAvatarUrl = other?.AvatarUrl,
            LastMessagePreview = conversation.LastMessagePreview,
            LastMessageAt = conversation.LastMessageAt,
            UnreadCount = unread,
            OtherUserIsOnline = presence.IsOnline,
            OtherUserLastSeenAt = presence.LastSeenAt
        };
    }

    private async Task EnsureWithinRateLimitAsync(Guid userId, CancellationToken cancellationToken)
    {
        var sentRecently = await _messageRepository.CountSentByUserSinceAsync(
            userId,
            DateTime.UtcNow.AddMinutes(-1),
            cancellationToken);

        if (sentRecently >= MaxMessagesPerMinute)
        {
            throw new ForbiddenException(ErrorCodes.MessageRateLimitExceeded);
        }
    }

    private static MessageType ResolveAttachmentMessageType(string mimeType) =>
        mimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
        AllowedImageMimeTypes.Contains(mimeType)
            ? MessageType.Image
            : MessageType.File;

    private static void EnsureAttachmentAllowed(string mimeType, MessageType messageType)
    {
        if (messageType == MessageType.Image)
        {
            if (!AllowedImageMimeTypes.Contains(mimeType))
            {
                throw new DomainException("Unsupported image type. Allowed: JPG, PNG, GIF, WEBP.");
            }

            return;
        }

        if (!AllowedFileMimeTypes.Contains(mimeType))
        {
            throw new DomainException("Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, TXT.");
        }
    }

    private static string BuildAttachmentPreview(MessageType messageType, string caption, string fileName)
    {
        if (!string.IsNullOrWhiteSpace(caption))
        {
            return caption;
        }

        return messageType == MessageType.Image
            ? "[Ảnh]"
            : $"[Tệp] {fileName}";
    }

    private async Task<MessageDto> MapMessageAsync(
        Message message,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        string? attachmentUrl = null;
        if (!string.IsNullOrWhiteSpace(message.AttachmentPath))
        {
            attachmentUrl = message.AttachmentPath.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                ? message.AttachmentPath
                : await _fileStorage.GetSignedUrlAsync(
                    message.AttachmentPath,
                    TimeSpan.FromHours(24),
                    cancellationToken);
        }

        return new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            Content = message.Content,
            MessageType = message.MessageType.ToString(),
            AttachmentUrl = attachmentUrl,
            AttachmentFileName = message.AttachmentFileName,
            AttachmentMimeType = message.AttachmentMimeType,
            AttachmentSizeBytes = message.AttachmentSizeBytes,
            SentAt = message.SentAt,
            IsMine = message.SenderId == currentUserId
        };
    }

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

    private async Task EnsureNotBlockedInConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken)
            ?? throw new NotFoundException("Conversation", conversationId);

        var otherParticipant = conversation.Participants.FirstOrDefault(p => p.UserId != userId);
        if (otherParticipant is null)
        {
            return;
        }

        if (await _blockRepository.IsBlockedEitherWayAsync(userId, otherParticipant.UserId, cancellationToken))
        {
            throw new UserBlockedException();
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
