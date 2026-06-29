using Moq;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Users;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.UnitTests.Users;

public sealed class BanStatusServiceTests
{
    private readonly Mock<IUserBanRepository> _banRepository = new();
    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private BanStatusService CreateSut() => new(_banRepository.Object);

    [Fact]
    public async Task GetActiveBanAsync_returns_null_when_no_ban()
    {
        _banRepository
            .Setup(r => r.GetLatestByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((UserBan?)null);

        var result = await CreateSut().GetActiveBanAsync(UserId);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetActiveBanAsync_returns_active_temp_ban()
    {
        var ban = new UserBan
        {
            UserId = UserId,
            BanType = BanType.Temp,
            Until = DateTime.UtcNow.AddDays(3)
        };

        _banRepository
            .Setup(r => r.GetLatestByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ban);

        var result = await CreateSut().GetActiveBanAsync(UserId);

        Assert.Same(ban, result);
    }

    [Fact]
    public async Task GetActiveBanAsync_returns_null_when_temp_ban_expired()
    {
        var ban = new UserBan
        {
            UserId = UserId,
            BanType = BanType.Temp,
            Until = DateTime.UtcNow.AddMinutes(-1)
        };

        _banRepository
            .Setup(r => r.GetLatestByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ban);

        var result = await CreateSut().GetActiveBanAsync(UserId);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetActiveBanAsync_returns_permanent_ban()
    {
        var ban = new UserBan
        {
            UserId = UserId,
            BanType = BanType.Permanent,
            Until = null
        };

        _banRepository
            .Setup(r => r.GetLatestByUserIdAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ban);

        var result = await CreateSut().GetActiveBanAsync(UserId);

        Assert.Same(ban, result);
    }
}
