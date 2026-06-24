using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Storage;
using SEHub.Application.Notifications;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Feed;

public sealed class PostService : IPostService
{
    private const long MaxCoverSizeBytes = 5_242_880;
    private static readonly HashSet<string> AllowedCoverContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp",
    };

    private readonly IPostRepository _postRepository;
    private readonly IPostImageRepository _imageRepository;
    private readonly IPostImageService _postImageService;
    private readonly IPostLikeRepository _likeRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserProfileRepository _profileRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IGamificationService _gamificationService;
    private readonly IImageCdnStorageService _cdnStorage;
    private readonly ICdnFolderSettings _cdnFolders;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly IFileStorageService _fileStorage;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PostService(
        IPostRepository postRepository,
        IPostImageRepository imageRepository,
        IPostImageService postImageService,
        IPostLikeRepository likeRepository,
        ICommentRepository commentRepository,
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        ICurrentUserService currentUser,
        IGamificationService gamificationService,
        IImageCdnStorageService cdnStorage,
        ICdnFolderSettings cdnFolders,
        IWorkflowNotificationService workflowNotifications,
        IFileStorageService fileStorage,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _postRepository = postRepository;
        _imageRepository = imageRepository;
        _postImageService = postImageService;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _currentUser = currentUser;
        _gamificationService = gamificationService;
        _cdnStorage = cdnStorage;
        _cdnFolders = cdnFolders;
        _workflowNotifications = workflowNotifications;
        _fileStorage = fileStorage;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResult<PostListItemDto>> GetPostsAsync(PostQueryParams query, CancellationToken cancellationToken = default)
    {
        var (items, total) = await _postRepository.GetPagedAsync(query, cancellationToken);
        var dtos = new List<PostListItemDto>();

        foreach (var post in items)
        {
            dtos.Add(await MapListItemAsync(post, cancellationToken));
        }

        return new PagedResult<PostListItemDto>
        {
            Items = dtos,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<IReadOnlyList<FeaturedPostDto>> GetFeaturedAsync(CancellationToken cancellationToken = default)
    {
        var posts = await _postRepository.GetFeaturedAsync(10, cancellationToken);
        var result = new List<FeaturedPostDto>();

        foreach (var post in posts)
        {
            var author = await BuildAuthorAsync(post.AuthorId, cancellationToken);
            result.Add(new FeaturedPostDto
            {
                Id = post.Id,
                Title = post.Title,
                Author = author,
                CreatedAt = post.CreatedAt
            });
        }

        return result;
    }

    public async Task<FeaturedPostsStateDto> GetFeaturedModeratorStateAsync(
        string? search,
        int candidatePageSize = 100,
        CancellationToken cancellationToken = default)
    {
        var pinnedPosts = await _postRepository.GetFeaturedAsync(GamificationConstants.MaxFeaturedPosts, cancellationToken);
        var (candidatePosts, _) = await _postRepository.GetPublishedCandidatesForFeaturingAsync(
            search,
            1,
            Math.Clamp(candidatePageSize, 1, 100),
            cancellationToken);

        var pinned = new List<FeaturedPostModeratorItemDto>();
        foreach (var post in pinnedPosts)
        {
            pinned.Add(await MapFeaturedModeratorItemAsync(post, cancellationToken));
        }

        var candidates = new List<FeaturedPostModeratorItemDto>();
        foreach (var post in candidatePosts)
        {
            candidates.Add(await MapFeaturedModeratorItemAsync(post, cancellationToken));
        }

        return new FeaturedPostsStateDto
        {
            Pinned = pinned,
            Candidates = candidates,
            MaxPinned = GamificationConstants.MaxFeaturedPosts,
        };
    }

    public async Task<PinnedPostsStateDto> GetPinnedModeratorStateAsync(
        string? search,
        int candidatePageSize = 100,
        CancellationToken cancellationToken = default)
    {
        var pinnedPosts = await _postRepository.GetPinnedAsync(GamificationConstants.MaxPinnedFeedPosts, cancellationToken);
        var (candidatePosts, _) = await _postRepository.GetPublishedCandidatesForPinningAsync(
            search,
            1,
            Math.Clamp(candidatePageSize, 1, 100),
            cancellationToken);

        var pinned = new List<FeaturedPostModeratorItemDto>();
        foreach (var post in pinnedPosts)
        {
            pinned.Add(await MapFeaturedModeratorItemAsync(post, cancellationToken));
        }

        var candidates = new List<FeaturedPostModeratorItemDto>();
        foreach (var post in candidatePosts)
        {
            candidates.Add(await MapFeaturedModeratorItemAsync(post, cancellationToken));
        }

        return new PinnedPostsStateDto
        {
            Pinned = pinned,
            Candidates = candidates,
            MaxPinned = GamificationConstants.MaxPinnedFeedPosts,
        };
    }

    public async Task<PostDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var post = await _postRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Post", id);

        EnsureCanViewPost(post);

        post.ViewCount++;
        await _postRepository.UpdateAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(post, cancellationToken);
    }

    public async Task<PostDetailDto> CreateAsync(CreatePostRequest request, CancellationToken cancellationToken = default)
    {
        var userId = RequireUserId();

        var post = new Post
        {
            Id = Guid.NewGuid(),
            AuthorId = userId,
            Title = request.Title,
            Content = request.Content,
            Tags = string.Join(',', request.Tags ?? []),
            CoverImageUrl = NormalizeCoverImageUrl(request.CoverImageUrl),
            Status = PostStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _postRepository.AddAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (!_currentUser.IsModeratorOrAdmin)
        {
            await _workflowNotifications.NotifyModeratorsPostPendingAsync(post, userId, cancellationToken);
        }

        return await MapDetailAsync(post, cancellationToken);
    }

    public async Task<PostDetailDto> UpdateAsync(Guid id, UpdatePostRequest request, CancellationToken cancellationToken = default)
    {
        var post = await _postRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Post", id);

        EnsureAuthorOrModerator(post.AuthorId);

        post.Title = request.Title;
        post.Content = request.Content;
        post.Tags = string.Join(',', request.Tags ?? []);
        if (request.CoverImageUrl is not null)
        {
            post.CoverImageUrl = NormalizeCoverImageUrl(request.CoverImageUrl);
        }
        var resubmittedForReview = post.Status == PostStatus.Rejected;
        if (resubmittedForReview)
        {
            post.Status = PostStatus.Pending;
        }

        post.UpdatedAt = DateTime.UtcNow;

        await _postRepository.UpdateAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (resubmittedForReview && !_currentUser.IsModeratorOrAdmin)
        {
            await _workflowNotifications.NotifyModeratorsPostPendingAsync(
                post,
                post.AuthorId,
                cancellationToken);
        }

        return await MapDetailAsync(post, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var post = await _postRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Post", id);

        EnsureAuthorOrModerator(post.AuthorId);
        await CdnAssetCleanup.TryDeleteAsync(_cdnStorage, publicId: null, post.CoverImageUrl, cancellationToken: cancellationToken);
        await _postImageService.DeleteImagesForPostAsync(id, cancellationToken);
        await _postRepository.SoftDeleteAsync(post, RequireUserId(), cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<PostDetailDto> SetFeaturedAsync(Guid id, FeaturePostRequest request, CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Only moderators can feature posts.");
        }

        var post = await _postRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Post", id);

        if (post.Status != PostStatus.Published)
        {
            throw new ForbiddenException("Only published posts can be featured.");
        }

        if (request.IsFeatured)
        {
            var featuredCount = await _postRepository.CountFeaturedAsync(cancellationToken);
            if (!post.IsFeatured && featuredCount >= GamificationConstants.MaxFeaturedPosts)
            {
                throw new ConflictException(
                    $"Chỉ được ghim tối đa {GamificationConstants.MaxFeaturedPosts} bài viết.");
            }
        }

        post.IsFeatured = request.IsFeatured;
        post.UpdatedAt = DateTime.UtcNow;
        await _postRepository.UpdateAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(post, cancellationToken);
    }

    public async Task<PostDetailDto> SetPinnedAsync(Guid id, PinPostRequest request, CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Only moderators can pin posts to feed.");
        }

        var post = await _postRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Post", id);

        if (post.Status != PostStatus.Published)
        {
            throw new ForbiddenException("Only published posts can be pinned to feed.");
        }

        if (request.IsPinned)
        {
            var pinnedCount = await _postRepository.CountPinnedAsync(cancellationToken);
            if (!post.IsPinned && pinnedCount >= GamificationConstants.MaxPinnedFeedPosts)
            {
                throw new ConflictException(
                    $"Chỉ được ghim tối đa {GamificationConstants.MaxPinnedFeedPosts} bài trên feed.");
            }
        }

        post.IsPinned = request.IsPinned;
        post.UpdatedAt = DateTime.UtcNow;
        await _postRepository.UpdateAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(post, cancellationToken);
    }

    public async Task<PostCoverUploadDto> UploadCoverAsync(
        Stream fileContent,
        string fileName,
        string contentType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default)
    {
        _ = RequireUserId();

        if (fileSizeBytes <= 0)
        {
            throw new DomainException("File is required.");
        }

        if (fileSizeBytes > MaxCoverSizeBytes)
        {
            throw new DomainException("Cover image cannot exceed 5 MB.");
        }

        var normalizedContentType = contentType?.Trim() ?? string.Empty;
        if (!AllowedCoverContentTypes.Contains(normalizedContentType))
        {
            throw new DomainException("Cover image must be JPEG, PNG, GIF, or WEBP.");
        }

        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            throw new DomainException("File name is required.");
        }

        var upload = await _cdnStorage.UploadImageAsync(
            fileContent,
            safeFileName,
            normalizedContentType,
            _cdnFolders.Posts,
            cancellationToken);

        return new PostCoverUploadDto { CoverImageUrl = upload.Url };
    }

    private async Task<FeaturedPostModeratorItemDto> MapFeaturedModeratorItemAsync(
        Post post,
        CancellationToken cancellationToken)
    {
        var author = await BuildAuthorAsync(post.AuthorId, cancellationToken);
        return new FeaturedPostModeratorItemDto
        {
            Id = post.Id,
            Title = post.Title,
            Excerpt = BuildExcerpt(post.Content),
            AuthorUsername = author.Username,
            AuthorDisplayName = author.DisplayName,
            IsFeatured = post.IsFeatured,
            IsPinned = post.IsPinned,
            LikeCount = await _likeRepository.CountByPostIdAsync(post.Id, cancellationToken),
            CommentCount = await _commentRepository.CountByPostIdAsync(post.Id, cancellationToken),
            CreatedAt = post.CreatedAt,
        };
    }

    private async Task<PostListItemDto> MapListItemAsync(Post post, CancellationToken cancellationToken)
    {
        bool? isLiked = null;
        if (_currentUser.UserId is Guid userId)
        {
            isLiked = await _likeRepository.GetAsync(post.Id, userId, cancellationToken) is not null;
        }

        var images = await _imageRepository.GetByPostIdAsync(post.Id, cancellationToken);

        return new PostListItemDto
        {
            Id = post.Id,
            Title = post.Title,
            Excerpt = BuildExcerpt(post.Content),
            ContentPreview = PostContentPreview.BuildContentPreview(post.Content),
            PreviewImageUrl = PostContentPreview.ExtractFirstImageUrl(post.Content),
            Author = await BuildAuthorAsync(post.AuthorId, cancellationToken),
            Tags = ParseTags(post.Tags),
            LikeCount = await _likeRepository.CountByPostIdAsync(post.Id, cancellationToken),
            CommentCount = await _commentRepository.CountByPostIdAsync(post.Id, cancellationToken),
            ViewCount = post.ViewCount,
            CreatedAt = post.CreatedAt,
            IsPinned = post.IsPinned,
            IsFeatured = post.IsFeatured,
            CoverImageUrl = await ResolveCoverImageUrlAsync(post.CoverImageUrl, cancellationToken),
            IsLiked = isLiked,
            Images = images.Select(PostImageService.MapDto).ToList()
        };
    }

    private async Task<PostDetailDto> MapDetailAsync(Post post, CancellationToken cancellationToken)
    {
        bool? isLiked = null;
        if (_currentUser.UserId is Guid userId)
        {
            isLiked = await _likeRepository.GetAsync(post.Id, userId, cancellationToken) is not null;
        }

        return new PostDetailDto
        {
            Id = post.Id,
            Title = post.Title,
            Content = post.Content,
            Tags = ParseTags(post.Tags),
            Status = post.Status.ToString(),
            Author = await BuildAuthorAsync(post.AuthorId, cancellationToken),
            LikeCount = await _likeRepository.CountByPostIdAsync(post.Id, cancellationToken),
            CommentCount = await _commentRepository.CountByPostIdAsync(post.Id, cancellationToken),
            ViewCount = post.ViewCount,
            IsPinned = post.IsPinned,
            IsFeatured = post.IsFeatured,
            CoverImageUrl = await ResolveCoverImageUrlAsync(post.CoverImageUrl, cancellationToken),
            IsLiked = isLiked,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            Images = (await _imageRepository.GetByPostIdAsync(post.Id, cancellationToken))
                .Select(PostImageService.MapDto)
                .ToList()
        };
    }

    private async Task<AuthorSummaryDto> BuildAuthorAsync(Guid authorId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(authorId, cancellationToken);
        var profile = await _profileRepository.GetByUserIdAsync(authorId, cancellationToken);

        return new AuthorSummaryDto
        {
            Id = authorId,
            Username = user?.Username ?? "unknown",
            DisplayName = user?.DisplayName ?? "Unknown",
            AvatarUrl = profile?.AvatarUrl
        };
    }

    private static string BuildExcerpt(string content) =>
        PostContentPreview.BuildTextExcerpt(content);

    private static IReadOnlyList<string> ParseTags(string tags) =>
        string.IsNullOrWhiteSpace(tags) ? [] : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static string? NormalizeCoverImageUrl(string? coverImageUrl)
    {
        if (string.IsNullOrWhiteSpace(coverImageUrl))
        {
            return null;
        }

        var trimmed = coverImageUrl.Trim();
        if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("posts/covers/", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        return null;
    }

    private async Task<string?> ResolveCoverImageUrlAsync(string? storedPath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(storedPath))
        {
            return null;
        }

        if (storedPath.StartsWith('/') || storedPath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return storedPath;
        }

        return await _fileStorage.GetSignedUrlAsync(storedPath, TimeSpan.FromDays(365), cancellationToken);
    }

    private Guid RequireUserId() =>
        _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

    private void EnsureCanViewPost(Post post)
    {
        if (post.Status == PostStatus.Published)
        {
            return;
        }

        if (_currentUser.IsModeratorOrAdmin)
        {
            return;
        }

        if (_currentUser.UserId == post.AuthorId)
        {
            return;
        }

        throw new NotFoundException("Post", post.Id);
    }

    private void EnsureAuthorOrModerator(Guid authorId)
    {
        if (_currentUser.IsModeratorOrAdmin)
        {
            return;
        }

        if (_currentUser.UserId != authorId)
        {
            throw new ForbiddenException("You do not have permission to modify this post.");
        }
    }
}
