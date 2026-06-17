using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Models;
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
    private readonly Mock<IFileStorageService> _fileStorage = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid PostId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid AuthorId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private PostService CreateSut() => new(
        _postRepository.Object,
        _imageRepository.Object,
        _postImageService.Object,
        _likeRepository.Object,
        _commentRepository.Object,
        _userRepository.Object,
        _profileRepository.Object,
        _currentUser.Object,
        _gamificationService.Object,
        _fileStorage.Object,
        _unitOfWork.Object,
        AutoMapperFactory.Create());

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
            g => g.AwardPostPublishedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithCoverPath_ResolvesPublicUrlWithoutDuplicatingUploadsPrefix()
    {
        const string storedPath = "posts/covers/abc123_photo.jpg";
        const string publicUrl = "/uploads/posts/covers/abc123_photo.jpg";

        _currentUser.SetupGet(u => u.UserId).Returns(AuthorId);
        _likeRepository.Setup(r => r.CountByPostIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _commentRepository.Setup(r => r.CountByPostIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        _userRepository.Setup(r => r.GetByIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = AuthorId, Username = "author", DisplayName = "Author" });
        _profileRepository.Setup(r => r.GetByUserIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);
        _fileStorage
            .Setup(s => s.GetSignedUrlAsync(storedPath, It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(publicUrl);

        Post? captured = null;
        _postRepository
            .Setup(r => r.AddAsync(It.IsAny<Post>(), It.IsAny<CancellationToken>()))
            .Callback<Post, CancellationToken>((post, _) => captured = post)
            .Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.CreateAsync(new CreatePostRequest
        {
            Title = "Cover Post",
            Content = "Post with cover image.",
            Tags = ["sehub"],
            CoverImageUrl = storedPath,
        });

        captured.Should().NotBeNull();
        captured!.CoverImageUrl.Should().Be(storedPath);
        result.CoverImageUrl.Should().Be(publicUrl);
        _fileStorage.Verify(
            s => s.GetSignedUrlAsync(storedPath, It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCoverStoredAsPublicPath_ReturnsPathWithoutReSigning()
    {
        const string storedPublicPath = "/uploads/posts/covers/abc123_photo.jpg";
        var post = new Post
        {
            Id = PostId,
            AuthorId = AuthorId,
            Title = "Cover Post",
            Content = "Body",
            Status = PostStatus.Published,
            CoverImageUrl = storedPublicPath,
            CreatedAt = DateTime.UtcNow,
        };

        _postRepository.Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(post);
        _likeRepository.Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        _commentRepository.Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        _userRepository.Setup(r => r.GetByIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = AuthorId, Username = "author", DisplayName = "Author" });
        _profileRepository.Setup(r => r.GetByUserIdAsync(AuthorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);

        var sut = CreateSut();
        var result = await sut.GetByIdAsync(PostId);

        result.CoverImageUrl.Should().Be(storedPublicPath);
        _fileStorage.Verify(
            s => s.GetSignedUrlAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()),
            Times.Never);
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
}
