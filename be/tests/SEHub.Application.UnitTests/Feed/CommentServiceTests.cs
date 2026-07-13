using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Models;
using SEHub.Application.Notifications;
using SEHub.Application.Profiles;
using SEHub.Contracts.Feed;
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
    private readonly Mock<IGamificationEventPublisher> _gamificationPublisher = new();
    private readonly Mock<IWorkflowNotificationService> _workflowNotifications = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private CommentService CreateSut() => new(
        _commentRepository.Object,
        _postRepository.Object,
        _userRepository.Object,
        _profileRepository.Object,
        _followRepository.Object,
        _gamificationPublisher.Object,
        _workflowNotifications.Object,
        _currentUser.Object,
        _unitOfWork.Object);

    [Fact]
    public async Task GetCommentsAsync_FlattensIncludedRepliesAndBuildsNestedTree()
    {
        var post = new Post
        {
            Id = PostId,
            AuthorId = Author1,
            Title = "Post",
            Content = "Body",
            Status = PostStatus.Published,
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
        var root = new Comment
        {
            Id = RootId,
            PostId = PostId,
            AuthorId = Author1,
            Content = "Root",
            CreatedAt = DateTime.UtcNow,
            Replies = [reply],
        };

        _postRepository.Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(post);
        _commentRepository
            .Setup(r => r.GetByPostIdAsync(PostId, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync([root]);
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
        result.Items[0].Replies![0].ParentCommentId.Should().Be(RootId);
    }

    [Fact]
    public async Task CreateAsync_Reply_ReturnsDtoWithoutThrowing()
    {
        var post = new Post
        {
            Id = PostId,
            AuthorId = Author1,
            Title = "Post",
            Content = "Body",
            Status = PostStatus.Published,
        };
        var parent = new Comment
        {
            Id = RootId,
            PostId = PostId,
            AuthorId = Author1,
            Content = "Root",
            CreatedAt = DateTime.UtcNow,
        };

        _currentUser.SetupGet(u => u.UserId).Returns(Author2);
        _postRepository.Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(post);
        _commentRepository.Setup(r => r.GetByIdAsync(RootId, It.IsAny<CancellationToken>())).ReturnsAsync(parent);
        _userRepository
            .Setup(r => r.GetByIdAsync(Author1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = Author1, Username = "author1", DisplayName = "Author 1" });
        _userRepository
            .Setup(r => r.GetByIdAsync(Author2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = Author2, Username = "author2", DisplayName = "Author 2" });
        _userRepository
            .Setup(r => r.GetByUsernameAsync("author1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = Author1, Username = "author1", DisplayName = "Author 1" });
        _profileRepository
            .Setup(r => r.GetByUserIdAsync(Author2, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);

        var sut = CreateSut();
        var dto = await sut.CreateAsync(PostId, new CreateCommentRequest
        {
            Content = "hello",
            ParentCommentId = RootId,
        });

        dto.ParentCommentId.Should().Be(RootId);
        dto.Content.Should().Contain("@author1");
        dto.Author.Username.Should().Be("author2");
        _commentRepository.Verify(r => r.AddAsync(It.IsAny<Comment>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_AuthorCanEditContent()
    {
        var comment = new Comment
        {
            Id = RootId,
            PostId = PostId,
            AuthorId = Author1,
            Content = "Old",
            CreatedAt = DateTime.UtcNow,
        };

        _currentUser.SetupGet(u => u.UserId).Returns(Author1);
        _currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);
        _commentRepository.Setup(r => r.GetByIdAsync(RootId, It.IsAny<CancellationToken>())).ReturnsAsync(comment);
        _userRepository
            .Setup(r => r.GetByIdAsync(Author1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount { Id = Author1, Username = "author1", DisplayName = "Author 1" });
        _profileRepository
            .Setup(r => r.GetByUserIdAsync(Author1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserProfile?)null);

        var sut = CreateSut();
        var dto = await sut.UpdateAsync(PostId, RootId, new UpdateCommentRequest { Content = "Updated text" });

        dto.Content.Should().Be("Updated text");
        comment.Content.Should().Be("Updated text");
        comment.UpdatedAt.Should().NotBeNull();
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_Root_SoftDeletesReplies()
    {
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

        _currentUser.SetupGet(u => u.UserId).Returns(Author1);
        _currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);
        _commentRepository.Setup(r => r.GetByIdAsync(RootId, It.IsAny<CancellationToken>())).ReturnsAsync(root);
        _commentRepository
            .Setup(r => r.GetRepliesByParentIdAsync(RootId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([reply]);

        var sut = CreateSut();
        await sut.DeleteAsync(PostId, RootId);

        _commentRepository.Verify(r => r.SoftDeleteAsync(root, Author1, It.IsAny<CancellationToken>()), Times.Once);
        _commentRepository.Verify(r => r.SoftDeleteAsync(reply, Author1, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
