using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Notifications;
using SEHub.Domain.Entities;

namespace SEHub.Application.UnitTests.Feed;

public sealed class PostLikeServiceTests
{
    private readonly Mock<IPostLikeRepository> _likeRepository = new();
    private readonly Mock<IPostRepository> _postRepository = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IGamificationService> _gamificationService = new();
    private readonly Mock<IWorkflowNotificationService> _workflowNotifications = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid PostId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid UserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid AuthorId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private PostLikeService CreateSut() => new(
        _likeRepository.Object,
        _postRepository.Object,
        _currentUser.Object,
        _gamificationService.Object,
        _workflowNotifications.Object,
        _unitOfWork.Object);

    [Fact]
    public async Task LikeAsync_WhenAlreadyLiked_IsIdempotentAndDoesNotAwardPointsAgain()
    {
        _currentUser.SetupGet(u => u.UserId).Returns(UserId);
        _postRepository
            .Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Post { Id = PostId, AuthorId = AuthorId, Title = "Test", Content = "Body" });
        _likeRepository
            .Setup(r => r.GetAsync(PostId, UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PostLike { PostId = PostId, UserId = UserId });
        _likeRepository
            .Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var sut = CreateSut();
        var result = await sut.LikeAsync(PostId);

        result.IsLiked.Should().BeTrue();
        result.LikeCount.Should().Be(1);
        _likeRepository.Verify(r => r.AddAsync(It.IsAny<PostLike>(), It.IsAny<CancellationToken>()), Times.Never);
        _gamificationService.Verify(
            g => g.AwardLikeReceivedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LikeAsync_WhenFirstLike_AwardsTwoPointsToAuthor()
    {
        _currentUser.SetupGet(u => u.UserId).Returns(UserId);
        _postRepository
            .Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Post { Id = PostId, AuthorId = AuthorId, Title = "Test", Content = "Body" });
        _likeRepository
            .Setup(r => r.GetAsync(PostId, UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PostLike?)null);
        _likeRepository
            .Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var sut = CreateSut();
        var result = await sut.LikeAsync(PostId);

        result.IsLiked.Should().BeTrue();
        _likeRepository.Verify(r => r.AddAsync(It.IsAny<PostLike>(), It.IsAny<CancellationToken>()), Times.Once);
        _gamificationService.Verify(
            g => g.AwardLikeReceivedAsync(AuthorId, It.IsAny<CancellationToken>()),
            Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
