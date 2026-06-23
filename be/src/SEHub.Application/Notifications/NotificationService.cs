using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Notifications;

public sealed class NotificationService : INotificationService
{
    private const int MaxPageSize = 50;

    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationNotifier _notificationNotifier;
    private readonly IUserSearchRepository _searchRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public NotificationService(
        INotificationRepository notificationRepository,
        INotificationNotifier notificationNotifier,
        IUserSearchRepository searchRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _notificationRepository = notificationRepository;
        _notificationNotifier = notificationNotifier;
        _searchRepository = searchRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<NotificationDto>> GetAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var (items, total) = await _notificationRepository.GetPagedForUserAsync(
            userId,
            page,
            pageSize,
            cancellationToken);

        var actorIds = items
            .Where(item => item.ActorUserId.HasValue)
            .Select(item => item.ActorUserId!.Value)
            .Distinct()
            .ToList();

        var actors = await _searchRepository.GetByIdsAsync(actorIds, cancellationToken);
        var actorUsernames = actors.ToDictionary(actor => actor.UserId, actor => actor.Username);

        return new PagedResult<NotificationDto>
        {
            Items = items
                .Select(item =>
                {
                    var actorUsername = item.ActorUserId.HasValue &&
                        actorUsernames.TryGetValue(item.ActorUserId.Value, out var username)
                            ? username
                            : null;
                    return Map(item, actorUsername);
                })
                .ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<UnreadNotificationCountDto> GetUnreadCountAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var total = await _notificationRepository.CountUnreadAsync(userId, cancellationToken);
        return new UnreadNotificationCountDto { TotalUnread = total };
    }

    public async Task MarkReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var notification = await _notificationRepository.GetByIdForUserAsync(notificationId, userId, cancellationToken)
            ?? throw new NotFoundException("Notification", notificationId);

        if (notification.IsRead)
        {
            return;
        }

        var now = DateTime.UtcNow;
        notification.IsRead = true;
        notification.ReadAt = now;
        notification.UpdatedAt = now;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var unread = await _notificationRepository.CountUnreadAsync(userId, cancellationToken);
        await _notificationNotifier.NotifyUnreadCountUpdatedAsync(userId, unread, cancellationToken);
    }

    public async Task MarkAllReadAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await _notificationRepository.MarkAllReadAsync(userId, DateTime.UtcNow, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _notificationNotifier.NotifyUnreadCountUpdatedAsync(userId, 0, cancellationToken);
    }

    public async Task CreateAsync(
        Guid userId,
        NotificationType type,
        string title,
        string? body = null,
        string? linkUrl = null,
        Guid? actorUserId = null,
        Guid? referenceId = null,
        CancellationToken cancellationToken = default)
    {
        if (actorUserId.HasValue && actorUserId.Value == userId)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var notification = new UserNotification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            LinkUrl = linkUrl,
            ActorUserId = actorUserId,
            ReferenceId = referenceId,
            IsRead = false,
            CreatedAt = now
        };

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var actorUsername = await ResolveActorUsernameAsync(notification.ActorUserId, cancellationToken);
        var dto = Map(notification, actorUsername);
        var unread = await _notificationRepository.CountUnreadAsync(userId, cancellationToken);

        await _notificationNotifier.NotifyCreatedAsync(userId, dto, cancellationToken);
        await _notificationNotifier.NotifyUnreadCountUpdatedAsync(userId, unread, cancellationToken);
    }

    private async Task<string?> ResolveActorUsernameAsync(
        Guid? actorUserId,
        CancellationToken cancellationToken)
    {
        if (!actorUserId.HasValue)
        {
            return null;
        }

        var rows = await _searchRepository.GetByIdsAsync([actorUserId.Value], cancellationToken);
        var username = rows.FirstOrDefault()?.Username;
        return string.IsNullOrWhiteSpace(username) ? null : username;
    }

    internal static NotificationDto Map(UserNotification notification, string? actorUsername = null) =>
        new()
        {
            Id = notification.Id,
            Type = notification.Type.ToString().ToLowerInvariant(),
            Title = notification.Title,
            Body = notification.Body,
            LinkUrl = ResolveLinkUrl(notification, actorUsername),
            ActorUserId = notification.ActorUserId,
            ActorUsername = actorUsername,
            ReferenceId = notification.ReferenceId,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        };

    private static string? ResolveLinkUrl(UserNotification notification, string? actorUsername)
    {
        if (string.IsNullOrWhiteSpace(actorUsername))
        {
            return notification.LinkUrl;
        }

        if (notification.Type is NotificationType.FriendRequest or NotificationType.FriendAccepted or NotificationType.Follow)
        {
            return $"/profile/{actorUsername}";
        }

        return notification.LinkUrl;
    }
}
