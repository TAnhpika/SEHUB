using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Gamification;
using SEHub.Application.Models;
using SEHub.Application.Notifications;
using SEHub.Application.Profiles;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Feed;

public sealed class CommentServiceTests
{
    private static readonly Guid PostId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid Author1 = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid Author2 = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid RootId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ReplyId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private readonly Mock<ICommentRepository> _commentRepository = new();
    private readonly Mock<IPostRepository> _postRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUserProfileRepository> _profileRepository = new();
    private readonly Mock<IUserFollowRepository> _followRepository = new();
    private readonly Mock<IBadgeCheckService> _badgeCheckService = new();
    private readonly Mock<IUserActivityService> _userActivityService = new();
    private readonly Mock<IWorkflowNotificationService> _workflowNotifications = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private CommentService CreateSut() => new(
        _commentRepository.Object,
        _postRepository.Object,
        _userRepository.Object,
        _profileRepository.Object,
        _followRepository.Object,
        _badgeCheckService.Object,
        _userActivityService.Object,
        _workflowNotifications.Object,
        _currentUser.Object,
        _unitOfWork.Object);

    [Fact]
    public async Task GetCommentsAsync_BatchesAuthorLookupsAndBuildsNestedTree()
    {
        var post = new Post
        {
            Id = PostId,
            AuthorId = Author1,
            Title = "Post",
            Content = "Body",
            Status = PostStatus.Published,
        };

        var root = new Comment
        {
            Id = RootId,
            PostId = PostId,
            AuthorId = Author1,
            Content = "Root",
            CreatedAt = DateTime.UtcNow,
        };
        var reply = new Comment
        {
            Id = ReplyId,
            PostId = PostId,
            AuthorId = Author2,
            ParentCommentId = RootId,
            Content = "Reply",
            CreatedAt = DateTime.UtcNow,
        };

        _postRepository.Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(post);
        _commentRepository
            .Setup(r => r.GetByPostIdAsync(PostId, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([root, reply]);
        _commentRepository
            .Setup(r => r.CountByPostIdAsync(PostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);
        _userRepository
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new UserAccount { Id = Author1, Username = "author1", DisplayName = "Author 1" },
                new UserAccount { Id = Author2, Username = "author2", DisplayName = "Author 2" },
            ]);
        _profileRepository
            .Setup(r => r.GetByUserIdsAsync(It.IsAny<IReadOnlyList<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var sut = CreateSut();
        var result = await sut.GetCommentsAsync(PostId, 1, 20);

        result.Items.Should().ContainSingle();
        result.Items[0].Author.Username.Should().Be("author1");
        result.Items[0].Replies.Should().ContainSingle();
        result.Items[0].Replies![0].Author.Username.Should().Be("author2");

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
