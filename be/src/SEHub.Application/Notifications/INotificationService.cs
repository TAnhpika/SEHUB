using SEHub.Contracts.Common;
using SEHub.Contracts.Notifications;
using SEHub.Domain.Enums;

namespace SEHub.Application.Notifications;

public interface INotificationService
{
    Task<PagedResult<NotificationDto>> GetAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<UnreadNotificationCountDto> GetUnreadCountAsync(CancellationToken cancellationToken = default);

    Task MarkReadAsync(Guid notificationId, CancellationToken cancellationToken = default);

    Task MarkAllReadAsync(CancellationToken cancellationToken = default);

    Task CreateAsync(
        Guid userId,
        NotificationType type,
        string title,
        string? body = null,
        string? linkUrl = null,
        Guid? actorUserId = null,
        Guid? referenceId = null,
        CancellationToken cancellationToken = default);
}
