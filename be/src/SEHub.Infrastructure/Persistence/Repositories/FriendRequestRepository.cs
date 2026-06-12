using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class FriendRequestRepository : IFriendRequestRepository
{
    private readonly SEHubDbContext _context;

    public FriendRequestRepository(SEHubDbContext context) => _context = context;

    public Task<FriendRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.FriendRequests.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task<FriendRequest?> GetActiveBetweenUsersAsync(
        Guid userId1,
        Guid userId2,
        CancellationToken cancellationToken = default) =>
        _context.FriendRequests
            .Where(r =>
                ((r.SenderId == userId1 && r.ReceiverId == userId2) ||
                 (r.SenderId == userId2 && r.ReceiverId == userId1)) &&
                (r.Status == FriendRequestStatus.Pending || r.Status == FriendRequestStatus.Accepted))
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(FriendRequest request, CancellationToken cancellationToken = default) =>
        await _context.FriendRequests.AddAsync(request, cancellationToken);

    public Task UpdateAsync(FriendRequest request, CancellationToken cancellationToken = default)
    {
        _context.FriendRequests.Update(request);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(FriendRequest request, CancellationToken cancellationToken = default)
    {
        _context.FriendRequests.Remove(request);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<FriendRequest>> GetPendingIncomingAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.FriendRequests
            .AsNoTracking()
            .Where(r => r.ReceiverId == userId && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FriendRequest>> GetPendingOutgoingAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.FriendRequests
            .AsNoTracking()
            .Where(r => r.SenderId == userId && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FriendRequest>> GetAcceptedForUserAsync(
        Guid userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await _context.FriendRequests
            .AsNoTracking()
            .Where(r =>
                r.Status == FriendRequestStatus.Accepted &&
                (r.SenderId == userId || r.ReceiverId == userId))
            .OrderByDescending(r => r.RespondedAt ?? r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountAcceptedForUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.FriendRequests.CountAsync(
            r => r.Status == FriendRequestStatus.Accepted &&
                 (r.SenderId == userId || r.ReceiverId == userId),
            cancellationToken);
}
