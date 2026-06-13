using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly SEHubDbContext _context;

    public NotificationRepository(SEHubDbContext context) => _context = context;

    public Task<UserNotification?> GetByIdForUserAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        _context.UserNotifications.FirstOrDefaultAsync(
            n => n.Id == notificationId && n.UserId == userId,
            cancellationToken);

    public async Task<(IReadOnlyList<UserNotification> Items, int TotalCount)> GetPagedForUserAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserNotifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<int> CountUnreadAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserNotifications.CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);

    public async Task AddAsync(UserNotification notification, CancellationToken cancellationToken = default) =>
        await _context.UserNotifications.AddAsync(notification, cancellationToken);

    public async Task MarkAllReadAsync(Guid userId, DateTime readAt, CancellationToken cancellationToken = default)
    {
        await _context.UserNotifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(n => n.IsRead, true)
                    .SetProperty(n => n.ReadAt, readAt)
                    .SetProperty(n => n.UpdatedAt, readAt),
                cancellationToken);
    }
}
