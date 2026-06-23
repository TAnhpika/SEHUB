using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Users;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Users;

public sealed class UserBlockService : IUserBlockService
{
    private readonly IUserBlockRepository _blockRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public UserBlockService(
        IUserBlockRepository blockRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _blockRepository = blockRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<BlockActionResultDto> BlockAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var blockerId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureTargetUserExistsAsync(targetUserId, cancellationToken);
        ValidateNotSelf(blockerId, targetUserId);

        var existing = await _blockRepository.GetAsync(blockerId, targetUserId, cancellationToken);
        if (existing is null)
        {
            await _blockRepository.AddAsync(new UserBlock
            {
                BlockerId = blockerId,
                BlockedUserId = targetUserId,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new BlockActionResultDto
        {
            UserId = targetUserId,
            IsBlockedByMe = true
        };
    }

    public async Task<BlockActionResultDto> UnblockAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var blockerId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureTargetUserExistsAsync(targetUserId, cancellationToken);

        var existing = await _blockRepository.GetAsync(blockerId, targetUserId, cancellationToken);
        if (existing is not null)
        {
            await _blockRepository.RemoveAsync(existing, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new BlockActionResultDto
        {
            UserId = targetUserId,
            IsBlockedByMe = false
        };
    }

    public async Task<BlockStatusDto> GetBlockStatusAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var viewerId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureTargetUserExistsAsync(targetUserId, cancellationToken);

        if (viewerId == targetUserId)
        {
            return new BlockStatusDto
            {
                IsBlockedByMe = false,
                IsBlockedByThem = false,
                IsBlockedEitherWay = false
            };
        }

        var blockedByMe = await _blockRepository.GetAsync(viewerId, targetUserId, cancellationToken) is not null;
        var blockedByThem = await _blockRepository.GetAsync(targetUserId, viewerId, cancellationToken) is not null;

        return new BlockStatusDto
        {
            IsBlockedByMe = blockedByMe,
            IsBlockedByThem = blockedByThem,
            IsBlockedEitherWay = blockedByMe || blockedByThem
        };
    }

    private async Task EnsureTargetUserExistsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null || user.IsBanned)
        {
            throw new NotFoundException("User", userId);
        }
    }

    private static void ValidateNotSelf(Guid actorId, Guid targetUserId)
    {
        if (actorId == targetUserId)
        {
            throw new DomainException("You cannot block yourself.");
        }
    }
}
