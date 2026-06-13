using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Profiles;

public sealed class ProfileService : IProfileService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserProfileRepository _profileRepository;
    private readonly IUserBadgeRepository _badgeRepository;
    private readonly IGamificationService _gamificationService;
    private readonly IUserFollowRepository _followRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public ProfileService(
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        IUserBadgeRepository badgeRepository,
        IGamificationService gamificationService,
        IUserFollowRepository followRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _badgeRepository = badgeRepository;
        _gamificationService = gamificationService;
        _followRepository = followRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<ProfileDto> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated)
        {
            throw new ForbiddenException("Authentication required.");
        }

        var user = await _userRepository.GetByUsernameAsync(username, cancellationToken)
            ?? throw new NotFoundException($"User '{username}' was not found.");

        return await BuildProfileAsync(user.Id, user, cancellationToken);
    }

    public async Task<ProfileDto> UpdateMyProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        var profile = await _profileRepository.GetByUserIdAsync(userId, cancellationToken);
        if (profile is null)
        {
            throw new NotFoundException("UserProfile", userId);
        }

        if (request.DisplayName is not null)
        {
            await _userRepository.UpdateDisplayNameAsync(userId, request.DisplayName, cancellationToken);
        }

        if (request.Bio is not null) profile.Bio = request.Bio;
        if (request.Major is not null) profile.Major = request.Major;
        if (request.Semester is not null && int.TryParse(request.Semester, out var semester))
        {
            profile.Semester = semester;
        }

        if (request.AvatarUrl is not null) profile.AvatarUrl = request.AvatarUrl;
        profile.UpdatedAt = DateTime.UtcNow;

        await _profileRepository.UpdateAsync(profile, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        user = await _userRepository.GetByIdAsync(userId, cancellationToken) ?? user;
        return await BuildProfileAsync(userId, user, cancellationToken);
    }

    private async Task<ProfileDto> BuildProfileAsync(Guid userId, Models.UserAccount user, CancellationToken cancellationToken)
    {
        var profile = await _profileRepository.GetByUserIdAsync(userId, cancellationToken);
        var (points, levelName, _) = await _gamificationService.GetUserGamificationAsync(userId, cancellationToken);
        var badges = await _badgeRepository.GetByUserIdAsync(userId, cancellationToken);
        var followersCount = await _followRepository.CountFollowersAsync(userId, cancellationToken);
        var followingCount = await _followRepository.CountFollowingAsync(userId, cancellationToken);

        bool? isFollowing = null;
        var viewerId = _currentUser.UserId;
        if (viewerId.HasValue && viewerId.Value != userId)
        {
            isFollowing = await _followRepository.ExistsAsync(viewerId.Value, userId, cancellationToken);
        }

        return new ProfileDto
        {
            UserId = userId,
            Username = user.Username,
            DisplayName = user.DisplayName,
            Bio = profile?.Bio,
            AvatarUrl = profile?.AvatarUrl,
            Major = profile?.Major,
            Semester = profile?.Semester?.ToString(),
            Points = points,
            LevelName = levelName,
            Badges = badges.Select(b => new BadgeDto
            {
                Code = b.Badge.Code,
                Name = b.Badge.Name,
                EarnedAt = b.EarnedAt
            }).ToList(),
            FollowersCount = followersCount,
            FollowingCount = followingCount,
            IsFollowing = isFollowing
        };
    }
}
