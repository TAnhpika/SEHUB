using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Notifications;
using SEHub.Contracts.Common;
using SEHub.Contracts.Friends;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Friends;

public sealed class FriendService : IFriendService
{
    private const int MaxPageSize = 50;

    private readonly IFriendRequestRepository _friendRequestRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserSearchRepository _searchRepository;
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public FriendService(
        IFriendRequestRepository friendRequestRepository,
        IUserRepository userRepository,
        IUserSearchRepository searchRepository,
        INotificationService notificationService,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _friendRequestRepository = friendRequestRepository;
        _userRepository = userRepository;
        _searchRepository = searchRepository;
        _notificationService = notificationService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<FriendRequestDto> SendRequestAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var senderId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureUserExistsAsync(targetUserId, cancellationToken);
        ValidateNotSelf(senderId, targetUserId);

        var existing = await _friendRequestRepository.GetActiveBetweenUsersAsync(senderId, targetUserId, cancellationToken);
        if (existing is not null)
        {
            if (existing.Status == FriendRequestStatus.Accepted)
            {
                throw new ConflictException("You are already friends with this user.");
            }

            if (existing.SenderId == senderId)
            {
                throw new ConflictException("Friend request already sent.");
            }

            throw new ConflictException("This user has already sent you a friend request.");
        }

        var request = new FriendRequest
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            ReceiverId = targetUserId,
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _friendRequestRepository.AddAsync(request, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var senderSummary = (await _searchRepository.GetByIdsAsync([senderId], cancellationToken)).FirstOrDefault();
        var senderName = senderSummary?.FullName ?? senderSummary?.Username ?? "Ai đó";

        await _notificationService.CreateAsync(
            targetUserId,
            NotificationType.FriendRequest,
            $"{senderName} đã gửi lời mời kết bạn",
            linkUrl: senderSummary is not null && !string.IsNullOrWhiteSpace(senderSummary.Username)
                ? $"/profile/{senderSummary.Username}"
                : null,
            actorUserId: senderId,
            referenceId: request.Id,
            cancellationToken: cancellationToken);

        return await MapRequestAsync(request, cancellationToken);
    }

    public async Task<FriendRequestDto> AcceptRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var request = await GetPendingRequestForReceiverAsync(requestId, userId, cancellationToken);

        request.Status = FriendRequestStatus.Accepted;
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _friendRequestRepository.UpdateAsync(request, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var accepterSummary = (await _searchRepository.GetByIdsAsync([userId], cancellationToken)).FirstOrDefault();
        var accepterName = accepterSummary?.FullName ?? accepterSummary?.Username ?? "Ai đó";

        await _notificationService.CreateAsync(
            request.SenderId,
            NotificationType.FriendAccepted,
            $"{accepterName} đã chấp nhận lời mời kết bạn",
            linkUrl: accepterSummary is not null ? $"/profile/{accepterSummary.Username}" : "/home/friends",
            actorUserId: userId,
            referenceId: request.Id,
            cancellationToken: cancellationToken);

        return await MapRequestAsync(request, cancellationToken);
    }

    public async Task<FriendRequestDto> RejectRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var request = await GetPendingRequestForReceiverAsync(requestId, userId, cancellationToken);

        request.Status = FriendRequestStatus.Rejected;
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _friendRequestRepository.UpdateAsync(request, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapRequestAsync(request, cancellationToken);
    }

    public async Task CancelRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var request = await _friendRequestRepository.GetByIdAsync(requestId, cancellationToken)
            ?? throw new NotFoundException("FriendRequest", requestId);

        if (request.SenderId != userId || request.Status != FriendRequestStatus.Pending)
        {
            throw new ForbiddenException("You cannot cancel this friend request.");
        }

        request.Status = FriendRequestStatus.Cancelled;
        request.RespondedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _friendRequestRepository.UpdateAsync(request, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task UnfriendAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var currentUserId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        ValidateNotSelf(currentUserId, userId);

        var friendship = await _friendRequestRepository.GetActiveBetweenUsersAsync(currentUserId, userId, cancellationToken);
        if (friendship is null || friendship.Status != FriendRequestStatus.Accepted)
        {
            throw new NotFoundException("Friendship", userId);
        }

        await _friendRequestRepository.DeleteAsync(friendship, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<FriendRequestDto>> GetRequestsAsync(
        string direction,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var normalized = direction.Trim().ToLowerInvariant();

        IReadOnlyList<FriendRequest> requests = normalized switch
        {
            "incoming" => await _friendRequestRepository.GetPendingIncomingAsync(userId, cancellationToken),
            "outgoing" => await _friendRequestRepository.GetPendingOutgoingAsync(userId, cancellationToken),
            _ => throw new DomainException("Direction must be 'incoming' or 'outgoing'.")
        };

        var mapped = new List<FriendRequestDto>();
        foreach (var request in requests)
        {
            mapped.Add(await MapRequestAsync(request, cancellationToken));
        }

        return mapped;
    }

    public async Task<PagedResult<FriendListItemDto>> GetFriendsAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var total = await _friendRequestRepository.CountAcceptedForUserAsync(userId, cancellationToken);
        var friendships = await _friendRequestRepository.GetAcceptedForUserAsync(userId, page, pageSize, cancellationToken);

        var friendUserIds = friendships
            .Select(f => f.SenderId == userId ? f.ReceiverId : f.SenderId)
            .ToList();

        var summaries = await _searchRepository.GetByIdsAsync(friendUserIds, cancellationToken);
        var summaryMap = summaries.ToDictionary(s => s.UserId);

        var items = friendships.Select(f =>
        {
            var friendId = f.SenderId == userId ? f.ReceiverId : f.SenderId;
            summaryMap.TryGetValue(friendId, out var summary);

            return new FriendListItemDto
            {
                UserId = friendId,
                Username = summary?.Username ?? string.Empty,
                FullName = summary?.FullName ?? string.Empty,
                AvatarUrl = summary?.AvatarUrl,
                LevelName = summary?.LevelName,
                FriendsSince = f.RespondedAt ?? f.CreatedAt
            };
        }).ToList();

        return new PagedResult<FriendListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<FriendStatusDto> GetFriendStatusAsync(Guid targetUserId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await EnsureUserExistsAsync(targetUserId, cancellationToken);

        if (userId == targetUserId)
        {
            return new FriendStatusDto { Status = "Self" };
        }

        var existing = await _friendRequestRepository.GetActiveBetweenUsersAsync(userId, targetUserId, cancellationToken);
        if (existing is null)
        {
            return new FriendStatusDto { Status = "None" };
        }

        return existing.Status switch
        {
            FriendRequestStatus.Accepted => new FriendStatusDto { Status = "Accepted", RequestId = existing.Id },
            FriendRequestStatus.Pending when existing.SenderId == userId => new FriendStatusDto
            {
                Status = "PendingOutgoing",
                RequestId = existing.Id
            },
            FriendRequestStatus.Pending => new FriendStatusDto
            {
                Status = "PendingIncoming",
                RequestId = existing.Id
            },
            _ => new FriendStatusDto { Status = "None" }
        };
    }

    private async Task<FriendRequest> GetPendingRequestForReceiverAsync(
        Guid requestId,
        Guid receiverId,
        CancellationToken cancellationToken)
    {
        var request = await _friendRequestRepository.GetByIdAsync(requestId, cancellationToken)
            ?? throw new NotFoundException("FriendRequest", requestId);

        if (request.ReceiverId != receiverId || request.Status != FriendRequestStatus.Pending)
        {
            throw new ForbiddenException("You cannot respond to this friend request.");
        }

        return request;
    }

    private async Task<FriendRequestDto> MapRequestAsync(FriendRequest request, CancellationToken cancellationToken)
    {
        var users = await _searchRepository.GetByIdsAsync(
            [request.SenderId, request.ReceiverId],
            cancellationToken);

        var sender = users.FirstOrDefault(u => u.UserId == request.SenderId);
        var receiver = users.FirstOrDefault(u => u.UserId == request.ReceiverId);

        return new FriendRequestDto
        {
            Id = request.Id,
            SenderId = request.SenderId,
            ReceiverId = request.ReceiverId,
            Status = request.Status.ToString(),
            CreatedAt = request.CreatedAt,
            SenderUsername = sender?.Username ?? string.Empty,
            SenderFullName = sender?.FullName ?? string.Empty,
            SenderAvatarUrl = sender?.AvatarUrl,
            ReceiverUsername = receiver?.Username ?? string.Empty,
            ReceiverFullName = receiver?.FullName ?? string.Empty,
            ReceiverAvatarUrl = receiver?.AvatarUrl
        };
    }

    private async Task EnsureUserExistsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null || user.IsBanned)
        {
            throw new NotFoundException("User", userId);
        }
    }

    private static void ValidateNotSelf(Guid currentUserId, Guid targetUserId)
    {
        if (currentUserId == targetUserId)
        {
            throw new DomainException("You cannot perform this action on yourself.");
        }
    }
}
