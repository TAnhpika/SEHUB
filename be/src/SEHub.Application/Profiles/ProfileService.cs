using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Storage;
using SEHub.Contracts.Common;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Profiles;

public sealed class ProfileService : IProfileService
{
    private const int MaxAvatarSizeBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedAvatarContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    };

    private readonly IUserRepository _userRepository;
    private readonly IUserProfileRepository _profileRepository;
    private readonly IUserBadgeRepository _badgeRepository;
    private readonly IPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IGamificationService _gamificationService;
    private readonly ILevelConfigRepository _levelConfigRepository;
    private readonly IUserFollowRepository _followRepository;
    private readonly IFileStorageService _fileStorage;
    private readonly IImageCdnStorageService _cdnStorage;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public ProfileService(
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        IUserBadgeRepository badgeRepository,
        IPostRepository postRepository,
        IPostLikeRepository likeRepository,
        ICommentRepository commentRepository,
        IGamificationService gamificationService,
        ILevelConfigRepository levelConfigRepository,
        IUserFollowRepository followRepository,
        IFileStorageService fileStorage,
        IImageCdnStorageService cdnStorage,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _badgeRepository = badgeRepository;
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _gamificationService = gamificationService;
        _levelConfigRepository = levelConfigRepository;
        _followRepository = followRepository;
        _fileStorage = fileStorage;
        _cdnStorage = cdnStorage;
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
        if (request.Gender is not null) profile.Gender = request.Gender;
        if (request.Phone is not null) profile.Phone = request.Phone;
        if (request.Address is not null) profile.Address = request.Address;

        if (request.DateOfBirth is not null)
        {
            profile.DateOfBirth = string.IsNullOrWhiteSpace(request.DateOfBirth)
                ? null
                : DateOnly.Parse(request.DateOfBirth);
        }

        profile.UpdatedAt = DateTime.UtcNow;

        await _profileRepository.UpdateAsync(profile, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        user = await _userRepository.GetByIdAsync(userId, cancellationToken) ?? user;
        return await BuildProfileAsync(userId, user, cancellationToken);
    }

    public async Task<ProfileAvatarUploadDto> UploadMyAvatarAsync(
        Stream fileContent,
        string fileName,
        string contentType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        if (fileSizeBytes <= 0)
        {
            throw new DomainException("File is required.");
        }

        if (fileSizeBytes > MaxAvatarSizeBytes)
        {
            throw new DomainException("Avatar size cannot exceed 5 MB.");
        }

        var normalizedContentType = contentType?.Trim() ?? string.Empty;
        if (!AllowedAvatarContentTypes.Contains(normalizedContentType))
        {
            throw new DomainException("Avatar must be JPEG, PNG, WEBP, or GIF.");
        }

        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            throw new DomainException("File name is required.");
        }

        var profile = await _profileRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("UserProfile", userId);

        var previousAvatarPath = profile.AvatarUrl;
        var upload = await _cdnStorage.UploadImageAsync(
            fileContent,
            safeFileName,
            normalizedContentType,
            CdnFolders.Avatars,
            cancellationToken);

        profile.AvatarUrl = upload.Url;
        profile.UpdatedAt = DateTime.UtcNow;

        await _profileRepository.UpdateAsync(profile, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await DeletePreviousAvatarAsync(previousAvatarPath, cancellationToken);

        return new ProfileAvatarUploadDto
        {
            AvatarUrl = upload.Url
        };
    }

    public async Task<PagedResult<ProfileRecentPostDto>> GetRecentPostsByUsernameAsync(
        string username,
        int page = 1,
        int pageSize = 5,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated)
        {
            throw new ForbiddenException("Authentication required.");
        }

        var user = await _userRepository.GetByUsernameAsync(username, cancellationToken)
            ?? throw new NotFoundException($"User '{username}' was not found.");

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 50);
        var (items, total) = await _postRepository.GetPagedByAuthorIdAsync(
            user.Id, safePage, safePageSize, cancellationToken);

        var dtos = new List<ProfileRecentPostDto>();
        foreach (var post in items)
        {
            dtos.Add(new ProfileRecentPostDto
            {
                Id = post.Id,
                Title = post.Title,
                LikeCount = await _likeRepository.CountByPostIdAsync(post.Id, cancellationToken),
                CommentCount = await _commentRepository.CountByPostIdAsync(post.Id, cancellationToken),
                CreatedAt = post.CreatedAt
            });
        }

        return new PagedResult<ProfileRecentPostDto>
        {
            Items = dtos,
            Page = safePage,
            PageSize = safePageSize,
            TotalCount = total
        };
    }

    private async Task<ProfileDto> BuildProfileAsync(Guid userId, Models.UserAccount user, CancellationToken cancellationToken)
    {
        var profile = await _profileRepository.GetByUserIdAsync(userId, cancellationToken);
        var (points, levelName, streakCount) = await _gamificationService.GetUserGamificationAsync(userId, cancellationToken);
        var levels = await _levelConfigRepository.GetAllOrderedAsync(cancellationToken);
        var nextLevel = levels.FirstOrDefault(level => level.MinPoints > points);
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
            AvatarUrl = await ResolveAvatarUrlAsync(profile?.AvatarUrl, cancellationToken),
            Gender = profile?.Gender,
            DateOfBirth = profile?.DateOfBirth?.ToString("yyyy-MM-dd"),
            Phone = profile?.Phone,
            Address = profile?.Address,
            Major = profile?.Major,
            Semester = profile?.Semester?.ToString(),
            Points = points,
            LevelName = levelName,
            StreakCount = streakCount,
            NextLevelPoints = nextLevel?.MinPoints,
            Badges = badges.Select(b => new BadgeDto
            {
                Code = b.Badge.Code,
                Name = b.Badge.Name,
                EarnedAt = b.EarnedAt
            }).ToList(),
            FollowersCount = followersCount,
            FollowingCount = followingCount,
            IsFollowing = isFollowing,
            MemberSince = user.CreatedAt,
            ProfileUpdatedAt = profile?.UpdatedAt ?? profile?.CreatedAt
        };
    }

    private async Task<string?> ResolveAvatarUrlAsync(string? avatarUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
        {
            return null;
        }

        if (avatarUrl.StartsWith('/') || avatarUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return avatarUrl;
        }

        return await _fileStorage.GetSignedUrlAsync(avatarUrl, TimeSpan.FromHours(24), cancellationToken);
    }

    private async Task DeletePreviousAvatarAsync(string? avatarUrl, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
        {
            return;
        }

        if (CdnUrlHelper.TryGetPublicId(avatarUrl, out var publicId, out var isRaw))
        {
            await _cdnStorage.DeleteAsync(publicId, isRaw, cancellationToken);
            return;
        }

        if (ShouldDeleteStoredAvatar(avatarUrl))
        {
            try
            {
                await _fileStorage.DeleteAsync(avatarUrl, cancellationToken);
            }
            catch (FileNotFoundException)
            {
                /* previous avatar already removed */
            }
        }
    }

    private static bool ShouldDeleteStoredAvatar(string? avatarUrl) =>
        !string.IsNullOrWhiteSpace(avatarUrl)
        && !avatarUrl.StartsWith('/')
        && !avatarUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase);
}
