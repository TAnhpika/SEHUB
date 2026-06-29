using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Notifications;
using SEHub.Application.Profiles;
using SEHub.Application.Storage;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Feed;

public sealed class SoftDeleteTests
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
    private readonly Mock<IImageCdnStorageService> _cdnStorage = new();
    private readonly Mock<ICdnFolderSettings> _cdnFolders = new();
    private readonly Mock<IWorkflowNotificationService> _workflowNotifications = new();
    private readonly Mock<IFileStorageService> _fileStorage = new();
    private readonly Mock<IPostTagRepository> _postTagRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid PostId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid AuthorId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid CommentId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private PostService CreatePostService()
    {
        _cdnFolders.SetupGet(f => f.Posts).Returns(CdnFolders.Posts);
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
            _cdnStorage.Object,
            _cdnFolders.Object,
            _workflowNotifications.Object,
            _fileStorage.Object,
            _postTagRepository.Object,
            _unitOfWork.Object,
            AutoMapperFactory.Create());
    }

    private CommentService CreateCommentService() => new(
        _commentRepository.Object,
        _postRepository.Object,
        _userRepository.Object,
        _profileRepository.Object,
        Mock.Of<IUserFollowRepository>(),
        Mock.Of<IGamificationEventPublisher>(),
        Mock.Of<IWorkflowNotificationService>(),
        _currentUser.Object,
        _unitOfWork.Object);

    [Fact]
    public async Task DeletePostAsync_SoftDeletesWithCurrentUser()
    {
        var post = new Post { Id = PostId, AuthorId = AuthorId, Title = "Delete me", Content = "Body" };
        _currentUser.SetupGet(u => u.UserId).Returns(AuthorId);
        _currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);
        _postRepository.Setup(r => r.GetByIdAsync(PostId, It.IsAny<CancellationToken>())).ReturnsAsync(post);

        var sut = CreatePostService();
        await sut.DeleteAsync(PostId);

        _postRepository.Verify(
            r => r.SoftDeleteAsync(post, AuthorId, It.IsAny<CancellationToken>()),
            Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteCommentAsync_SoftDeletesWithCurrentUser()
    {
        var comment = new Comment
        {
            Id = CommentId,
            PostId = PostId,
            AuthorId = AuthorId,
            Content = "Remove me"
        };

        _currentUser.SetupGet(u => u.UserId).Returns(AuthorId);
        _currentUser.SetupGet(u => u.IsModeratorOrAdmin).Returns(false);
        _commentRepository.Setup(r => r.GetByIdAsync(CommentId, It.IsAny<CancellationToken>())).ReturnsAsync(comment);

        var sut = CreateCommentService();
        await sut.DeleteAsync(PostId, CommentId);

        _commentRepository.Verify(
            r => r.SoftDeleteAsync(comment, AuthorId, It.IsAny<CancellationToken>()),
            Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
