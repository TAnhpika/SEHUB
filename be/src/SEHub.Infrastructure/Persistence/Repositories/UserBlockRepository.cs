using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserBlockRepository : IUserBlockRepository
{
    private readonly SEHubDbContext _context;

    public UserBlockRepository(SEHubDbContext context) => _context = context;

    public Task<UserBlock?> GetAsync(
        Guid blockerId,
        Guid blockedUserId,
        CancellationToken cancellationToken = default) =>
        _context.UserBlocks.FirstOrDefaultAsync(
            b => b.BlockerId == blockerId && b.BlockedUserId == blockedUserId,
            cancellationToken);

    public Task<bool> IsBlockedEitherWayAsync(
        Guid userA,
        Guid userB,
        CancellationToken cancellationToken = default) =>
        _context.UserBlocks.AnyAsync(
            b =>
                (b.BlockerId == userA && b.BlockedUserId == userB) ||
                (b.BlockerId == userB && b.BlockedUserId == userA),
            cancellationToken);

    public async Task<IReadOnlyList<Guid>> GetBlockedRelatedUserIdsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var blockedByMe = _context.UserBlocks
            .Where(b => b.BlockerId == userId)
            .Select(b => b.BlockedUserId);

        var blockedMe = _context.UserBlocks
            .Where(b => b.BlockedUserId == userId)
            .Select(b => b.BlockerId);

        return await blockedByMe
            .Union(blockedMe)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Guid>> GetBlockedByMeUserIdsAsync(
        Guid blockerId,
        CancellationToken cancellationToken = default) =>
        await _context.UserBlocks
            .Where(b => b.BlockerId == blockerId)
            .Select(b => b.BlockedUserId)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<UserBlock>> GetBlockedByMeAsync(
        Guid blockerId,
        CancellationToken cancellationToken = default) =>
        await _context.UserBlocks
            .Where(b => b.BlockerId == blockerId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(UserBlock block, CancellationToken cancellationToken = default) =>
        await _context.UserBlocks.AddAsync(block, cancellationToken);

    public Task RemoveAsync(UserBlock block, CancellationToken cancellationToken = default)
    {
        _context.UserBlocks.Remove(block);
        return Task.CompletedTask;
    }
}
