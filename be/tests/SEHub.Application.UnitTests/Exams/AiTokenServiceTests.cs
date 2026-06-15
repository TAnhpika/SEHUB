using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Exams;

public class AiTokenServiceTests
{
    private readonly Mock<IAiTokenUsageRepository> _tokenRepository = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly AiTokenService _sut;
    private readonly Guid _userId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    public AiTokenServiceTests()
    {
        _currentUser.Setup(x => x.UserId).Returns(_userId);
        _currentUser.Setup(x => x.IsPremium).Returns(false);
        _currentUser.Setup(x => x.IsModeratorOrAdmin).Returns(false);

        _sut = new AiTokenService(
            _tokenRepository.Object,
            _currentUser.Object,
            _unitOfWork.Object,
            Options.Create(new AiTokenLimitSettings
            {
                DailyTokenLimitFree = 10,
                DailyTokenLimitPremium = 1000,
                TokenCostExplain = 10,
                TokenCostChat = 10,
            }));
    }

    [Fact]
    public async Task GetStatusAsync_ReturnsRemainingTokens_ForFreeUser()
    {
        _tokenRepository
            .Setup(x => x.GetTodayConsumedAsync(_userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        var status = await _sut.GetStatusAsync(_userId);

        status.Limit.Should().Be(10);
        status.Remaining.Should().Be(10);
        status.CanExplain.Should().BeTrue();
        status.CostExplain.Should().Be(10);
    }

    [Fact]
    public async Task EnsureCanConsumeAsync_Throws_WhenLimitExceeded()
    {
        _tokenRepository
            .Setup(x => x.GetTodayConsumedAsync(_userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(5);

        var act = () => _sut.EnsureCanConsumeAsync(_userId, 10);

        await act.Should().ThrowAsync<ForbiddenException>()
            .Where(ex => ex.Message == ErrorCodes.TokenLimitExceeded);
    }

    [Fact]
    public async Task RecordConsumptionAsync_PersistsUsageAndReturnsRemaining()
    {
        _tokenRepository
            .Setup(x => x.GetTodayUsageAsync(_userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AiTokenDailyUsage?)null);

        var remaining = await _sut.RecordConsumptionAsync(_userId, 10);

        remaining.Should().Be(0);
        _tokenRepository.Verify(x => x.AddAsync(It.IsAny<AiTokenDailyUsage>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
