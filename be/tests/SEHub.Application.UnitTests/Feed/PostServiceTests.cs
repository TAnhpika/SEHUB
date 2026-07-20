using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Models;
using SEHub.Application.Notifications;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Feed;

public sealed class PostServiceTests
{
    private readonly Mock<IPostRepository> _postRepository = new();
    private readonly Mock<IPostImageRepository> _imageRepository = new();
    private readonly Mock<IPostImageService> _postImageService = new();
    private readonly Mock<IPostLikeRepository> _likeRepository = new();
    private readonly Mock<ICommentRepository> _commentRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUserProfileRepository> _profileRepository = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IGamificationService> _gamificationService = new();
    private readonly Mock<IWorkflowNotificationService> _workflowNotifications = new();
    private readonly Mock<IPostTagRepository> _postTagRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid PostId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid AuthorId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private PostService CreateSut()
    {
        _postTagRepository
            .Setup(r => r.GetTagNamesForPostAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _postTagRepository
            .Setup(r => r.GetTagNamesForPostsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, IReadOnlyList<string>>());
        return new(
            _postRepository.Object,
            _imageRepository.Object,
            _postImageService.Object,
            _likeRepository.Object,
            _commentRepository.Object,
            _userRepository.Object,
            _profileRepository.Object,
            _currentUser.Object,
            _gamificationService.Object,
            _workflowNotifications.Object,
            _postTagRepository.Object,
            _unitOfWork.Object);
    }

    [Fact]
    public async Task CreateAsync_StartsAsPending()
    {
        _currentUser.SetupGet(u => u.UserId).Returns(AuthorId);
        _likeRepository.Setup(r => r.CountByPostIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _commentRepository.Setup(r => r.CountByPostIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _imageRepository.Setup(r => r.GetByPostIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _userRepository.Setup(r => r.GetByIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = AuthorId, Username = "author", DisplayName = "Author" });
        _profileRepository.Setup(r => r.GetByUserIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);

        Post? captured = null;
        _postRepository
            .Setup(r => r.AddAsync(It.IsAny<Post>(), It.IsAny<CancellationToken>()))
            .Callback<Post, CancellationToken>((post, _) => captured = post)
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.CreateAsync(new CreatePostRequest
        {
            Title = "Pending Post",
            Content = "Awaiting moderator approval.",
            Tags = ["sehub"]
        });

        captured.Should().NotBeNull();
        captured!.Status.Should().Be(PostStatus.Pending);
        result.Status.Should().Be(nameof(PostStatus.Pending));
        _gamificationService.Verify(
            g => g.AwardPostPublishedAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetByIdAsync_WhenImagesExist_ReturnsOrderedGallery()
    {
        const string firstUrl = "https://cdn.example/posts/first.jpg";
        const string secondUrl = "https://cdn.example/posts/second.jpg";
        var post = new Post
        {
            Id = PostId,
            AuthorId = AuthorId,
            Title = "Gallery Post",
            Content = "Body",
            Status = PostStatus.Published,
            CreatedAt = DateTime.UtcNow,
        };

        _postRepository.Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(post);
        _likeRepository.Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        _commentRepository.Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        _imageRepository.Setup(r => r.GetByPostIdAsync(PostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new PostImage
                {
                    Id = Guid.NewGuid(),
                    PostId = PostId,
                    Url = firstUrl,
                    SortOrder = 0,
                    PublicId = "first",
                },
                new PostImage
                {
                    Id = Guid.NewGuid(),
                    PostId = PostId,
                    Url = secondUrl,
                    SortOrder = 1,
                    PublicId = "second",
                }
            ]);
        _userRepository.Setup(r => r.GetByIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = AuthorId, Username = "author", DisplayName = "Author" });
        _profileRepository.Setup(r => r.GetByUserIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);

        var sut = CreateSut();
        var result = await sut.GetByIdAsync(PostId);

        result.Images.Should().HaveCount(2);
        result.Images[0].ImagePath.Should().Be(firstUrl);
        result.Images[1].ImagePath.Should().Be(secondUrl);
    }

    [Fact]
    public async Task UpdateAsync_WhenRejected_MovesStatusToPending()
    {
        var post = new Post
        {
            Id = PostId,
            AuthorId = AuthorId,
            Title = "Old",
            Content = "Old body",
            Status = PostStatus.Rejected
        };

        _currentUser.SetupGet(u => u.UserId).Returns(AuthorId);
        _currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);
        _postRepository.Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(post);
        _likeRepository.Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        _commentRepository.Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        _imageRepository.Setup(r => r.GetByPostIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        _userRepository.Setup(r => r.GetByIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = AuthorId, Username = "author", DisplayName = "Author" });
        _profileRepository.Setup(r => r.GetByUserIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);

        var sut = CreateSut();
        var result = await sut.UpdateAsync(PostId, new UpdatePostRequest
        {
            Title = "Resubmitted",
            Content = "Updated content",
            Tags = ["sehub"]
        });

        post.Status.Should().Be(PostStatus.Pending);
        result.Status.Should().Be(nameof(PostStatus.Pending));
        result.Title.Should().Be("Resubmitted");
    }

    [Fact]
    public async Task GetPostsAsync_List_ReturnsGalleryImagesOrderedBySortOrder()
    {
        const string imageUrl = "https://cdn.example/posts/photo.jpg";
        var post = new Post
        {
            Id = PostId,
            AuthorId = AuthorId,
            Title = "List Post",
            Content = "Body",
            Status = PostStatus.Published,
            CreatedAt = DateTime.UtcNow,
        };
        var postImage = new PostImage
        {
            Id = Guid.NewGuid(),
            PostId = PostId,
            Url = imageUrl,
            SortOrder = 0,
            PublicId = "photo",
        };

        _postRepository
            .Setup(r => r.GetPagedAsync(It.IsAny<PostQueryParams>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(([post], 1));
        _likeRepository
            .Setup(r => r.CountByPostIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, int>());
        _commentRepository
            .Setup(r => r.CountByPostIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<Guid, int>());
        _imageRepository
            .Setup(r => r.GetByPostIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([postImage]);
        _userRepository
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new UserAccount { Id = AuthorId, Username = "author", DisplayName = "Author" }]);
        _profileRepository
            .Setup(r => r.GetByUserIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var sut = CreateSut();
        var result = await sut.GetPostsAsync(new PostQueryParams { Page = 1, PageSize = 5 });

        result.Items.Should().ContainSingle();
        result.Items[0].Images.Should().ContainSingle();
        result.Items[0].Images[0].ImagePath.Should().Be(imageUrl);
    }

    [Fact]
    public async Task GetFeaturedAsync_BatchesAuthorLookups()
    {
        var author2 = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var posts = new List<Post>
        {
            new()
            {
                Id = PostId,
                AuthorId = AuthorId,
                Title = "Featured 1",
                Content = "Body",
                Status = PostStatus.Published,
                CreatedAt = DateTime.UtcNow,
            },
            new()
            {
                Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                AuthorId = author2,
                Title = "Featured 2",
                Content = "Body",
                Status = PostStatus.Published,
                CreatedAt = DateTime.UtcNow,
            },
        };

        _postRepository
            .Setup(r => r.GetFeaturedAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(posts);
        _userRepository
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new UserAccount { Id = AuthorId, Username = "author1", DisplayName = "Author 1" },
                new UserAccount { Id = author2, Username = "author2", DisplayName = "Author 2" },
            ]);
        _profileRepository
            .Setup(r => r.GetByUserIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var sut = CreateSut();
        var result = await sut.GetFeaturedAsync();

        result.Should().HaveCount(2);
        result[0].Author.Username.Should().Be("author1");
        result[1].Author.Username.Should().Be("author2");
        _userRepository.Verify(
            r => r.GetByIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()),
            Times.Once);
        _userRepository.Verify(
            r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _profileRepository.Verify(
            r => r.GetByUserIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()),
            Times.Once);
        _profileRepository.Verify(
            r => r.GetByUserIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
