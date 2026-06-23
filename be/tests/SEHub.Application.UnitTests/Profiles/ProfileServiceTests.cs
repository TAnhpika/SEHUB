using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Models;
using SEHub.Application.Profiles;
using SEHub.Application.Storage;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.UnitTests.Profiles;

public sealed class ProfileServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUserProfileRepository> _profileRepository = new();
    private readonly Mock<IUserBadgeRepository> _badgeRepository = new();
    private readonly Mock<IPostRepository> _postRepository = new();
    private readonly Mock<IPostLikeRepository> _likeRepository = new();
    private readonly Mock<ICommentRepository> _commentRepository = new();
    private readonly Mock<IGamificationService> _gamificationService = new();
    private readonly Mock<ILevelConfigRepository> _levelConfigRepository = new();
    private readonly Mock<IUserFollowRepository> _followRepository = new();
    private readonly Mock<IFileStorageService> _fileStorage = new();
    private readonly Mock<IImageCdnStorageService> _cdnStorage = new();
    private readonly Mock<ICdnFolderSettings> _cdnFolders = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();

    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private ProfileService CreateSut()
    {
        _cdnFolders.SetupGet(f => f.Avatars).Returns(CdnFolders.Avatars);
        return new(
            _userRepository.Object,
            _profileRepository.Object,
            _badgeRepository.Object,
            _postRepository.Object,
            _likeRepository.Object,
            _commentRepository.Object,
            _gamificationService.Object,
            _levelConfigRepository.Object,
            _followRepository.Object,
            _fileStorage.Object,
            _cdnStorage.Object,
            _cdnFolders.Object,
            _currentUser.Object,
            _unitOfWork.Object);
    }

    [Fact]
    public async Task UploadMyAvatarAsync_StoresFileAndReturnsPublicUrl()
    {
        var profile = new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            CreatedAt = DateTime.UtcNow
        };

        _currentUser.SetupGet(u => u.UserId).Returns(UserId);
        _profileRepository.Setup(r => r.GetByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(profile);
        _cdnStorage.Setup(s => s.UploadImageAsync(
                It.IsAny<Stream>(),
                "avatar.png",
                "image/png",
                CdnFolders.Avatars,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CdnUploadResult
            {
                PublicId = "sehub/avatars/new",
                Url = "https://res.cloudinary.com/test/image/upload/sehub/avatars/new.png",
                ContentType = "image/png",
                FileSize = 3
            });

        var sut = CreateSut();
        using var stream = new MemoryStream([1, 2, 3]);
        var result = await sut.UploadMyAvatarAsync(stream, "avatar.png", "image/png", 3);

        result.AvatarUrl.Should().Be("https://res.cloudinary.com/test/image/upload/sehub/avatars/new.png");
        profile.AvatarUrl.Should().Be("https://res.cloudinary.com/test/image/upload/sehub/avatars/new.png");
        _profileRepository.Verify(r => r.UpdateAsync(profile, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadMyAvatarAsync_WhenFileTooLarge_ThrowsDomainException()
    {
        _currentUser.SetupGet(u => u.UserId).Returns(UserId);

        var sut = CreateSut();
        using var stream = new MemoryStream([1]);
        var act = () => sut.UploadMyAvatarAsync(stream, "avatar.png", "image/png", 6 * 1024 * 1024);

        await act.Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task UpdateMyProfileAsync_PersistsExtendedFields()
    {
        var profile = new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            CreatedAt = DateTime.UtcNow
        };

        _currentUser.SetupGet(u => u.UserId).Returns(UserId);
        _userRepository.Setup(r => r.GetByIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new UserAccount
            {
                Id = UserId,
                Username = "anhpika",
                DisplayName = "Anhpika",
                CreatedAt = DateTime.UtcNow
            });
        _profileRepository.Setup(r => r.GetByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(profile);
        _badgeRepository.Setup(r => r.GetByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _gamificationService.Setup(g => g.GetUserGamificationAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((10, "Bronze", 0));
        _levelConfigRepository.Setup(r => r.GetAllOrderedAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _followRepository.Setup(r => r.CountFollowersAsync(UserId, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        _followRepository.Setup(r => r.CountFollowingAsync(UserId, It.IsAny<CancellationToken>())).ReturnsAsync(0);

        var sut = CreateSut();
        var result = await sut.UpdateMyProfileAsync(new UpdateProfileRequest
        {
            DisplayName = "Anhpika Updated",
            Gender = "female",
            DateOfBirth = "2000-05-15",
            Phone = "0123456789",
            Address = "Ha Noi",
            Bio = "Hello",
            Major = "SE"
        });

        profile.Gender.Should().Be("female");
        profile.DateOfBirth.Should().Be(new DateOnly(2000, 5, 15));
        profile.Phone.Should().Be("0123456789");
        profile.Address.Should().Be("Ha Noi");
        result.Gender.Should().Be("female");
        result.Phone.Should().Be("0123456789");
    }
}
