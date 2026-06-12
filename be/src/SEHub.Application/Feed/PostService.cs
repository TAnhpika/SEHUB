using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Feed;

public sealed class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly IPostLikeRepository _likeRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserProfileRepository _profileRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IGamificationService _gamificationService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public PostService(
        IPostRepository postRepository,
        IPostLikeRepository likeRepository,
        ICommentRepository commentRepository,
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        ICurrentUserService currentUser,
        IGamificationService gamificationService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _postRepository = postRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _currentUser = currentUser;
        _gamificationService = gamificationService;
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
            Status = PostStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _postRepository.AddAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

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
        if (post.Status == PostStatus.Rejected)
        {
            post.Status = PostStatus.Pending;
        }

        post.UpdatedAt = DateTime.UtcNow;

        await _postRepository.UpdateAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(post, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var post = await _postRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Post", id);

        EnsureAuthorOrModerator(post.AuthorId);
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

        post.IsFeatured = request.IsFeatured;
        post.UpdatedAt = DateTime.UtcNow;
        await _postRepository.UpdateAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapDetailAsync(post, cancellationToken);
    }

    private async Task<PostListItemDto> MapListItemAsync(Post post, CancellationToken cancellationToken)
    {
        return new PostListItemDto
        {
            Id = post.Id,
            Title = post.Title,
            Excerpt = BuildExcerpt(post.Content),
            Author = await BuildAuthorAsync(post.AuthorId, cancellationToken),
            Tags = ParseTags(post.Tags),
            LikeCount = await _likeRepository.CountByPostIdAsync(post.Id, cancellationToken),
            CommentCount = await _commentRepository.CountByPostIdAsync(post.Id, cancellationToken),
            CreatedAt = post.CreatedAt,
            IsFeatured = post.IsFeatured
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
            IsFeatured = post.IsFeatured,
            IsLiked = isLiked,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
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
        content.Length <= 200 ? content : content[..200] + "...";

    private static IReadOnlyList<string> ParseTags(string tags) =>
        string.IsNullOrWhiteSpace(tags) ? [] : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

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
