using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Auth;
using SEHub.Application.Gamification;
using SEHub.Application.Premium;
using SEHub.Application.Profiles;
using SEHub.Application.Models;
using SEHub.Contracts.Auth;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Auth;

public sealed class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUserProfileRepository> _profileRepository = new();
    private readonly Mock<ISubscriptionRepository> _subscriptionRepository = new();
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepository = new();
    private readonly Mock<IJwtTokenService> _jwtTokenService = new();
    private readonly Mock<IOtpService> _otpService = new();
    private readonly Mock<IGoogleTokenValidator> _googleTokenValidator = new();
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<IBadgeCheckService> _badgeCheckService = new();
    private readonly Mock<IUserActivityService> _userActivityService = new();
    private readonly Mock<IProfileStatsService> _profileStatsService = new();
    private readonly Mock<IPremiumService> _premiumService = new();
    private readonly Mock<IAiTokenService> _aiTokenService = new();
    private readonly Mock<IServiceScopeFactory> _scopeFactory = new();
    private readonly Mock<ILogger<AuthService>> _logger = new();
    private readonly IMapper _mapper;

    private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public AuthServiceTests()
    {
        _mapper = new MapperConfiguration(cfg => cfg.CreateMap<UserAccount, AuthUserDto>()).CreateMapper();
    }

    private AuthService CreateSut(AuthSettings? authSettings = null, JwtSettings? jwtSettings = null) => new(
        _userRepository.Object,
        _profileRepository.Object,
        _subscriptionRepository.Object,
        _refreshTokenRepository.Object,
        _jwtTokenService.Object,
        _otpService.Object,
        _googleTokenValidator.Object,
        _currentUser.Object,
        _unitOfWork.Object,
        _mapper,
        Options.Create(authSettings ?? new AuthSettings()),
        Options.Create(jwtSettings ?? new JwtSettings { RefreshExpirationDays = 7 }),
        _badgeCheckService.Object,
        _userActivityService.Object,
        _profileStatsService.Object,
        _premiumService.Object,
        _aiTokenService.Object,
        _scopeFactory.Object,
        _logger.Object);

    private void SetupSuccessfulLoginMocks(UserAccount user)
    {
        _userRepository
            .Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepository
            .Setup(r => r.IsCurrentlyBannedAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _userRepository
            .Setup(r => r.UpdateStreakOnActivityAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StreakUpdateResult(false, user.StreakCount));
        _userActivityService
            .Setup(s => s.RecordActivityAsync(user.Id, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _subscriptionRepository
            .Setup(r => r.GetActiveByUserIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Subscription?)null);
        _profileRepository
            .Setup(r => r.GetByUserIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.UserProfile?)null);
        _jwtTokenService
            .Setup(s => s.GenerateAccessToken(user, false))
            .Returns(("access-token", 3600));
        _jwtTokenService
            .Setup(s => s.GenerateRefreshTokenValue())
            .Returns("refresh-token-value");
        _refreshTokenRepository
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ThrowsNotFoundException()
    {
        var user = CreateUser();
        _userRepository
            .Setup(r => r.GetByEmailOrUsernameAsync("student@test.local", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepository
            .Setup(r => r.ValidatePasswordAsync(user.Id, "WrongPass1!", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var sut = CreateSut();
        var act = () => sut.LoginAsync(new LoginRequest
        {
            EmailOrUsername = "student@test.local",
            Password = "WrongPass1!"
        });

        var exception = await act.Should().ThrowAsync<NotFoundException>();
        exception.Which.Message.Should().Be("Invalid credentials.");
    }

    [Fact]
    public async Task LoginAsync_WhenUserIsBanned_ThrowsForbiddenException()
    {
        var user = CreateUser();
        _userRepository
            .Setup(r => r.GetByEmailOrUsernameAsync("student@test.local", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepository
            .Setup(r => r.ValidatePasswordAsync(user.Id, "ValidPass1!", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _userRepository
            .Setup(r => r.IsCurrentlyBannedAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var sut = CreateSut();
        var act = () => sut.LoginAsync(new LoginRequest
        {
            EmailOrUsername = "student@test.local",
            Password = "ValidPass1!"
        });

        var exception = await act.Should().ThrowAsync<ForbiddenException>();
        exception.Which.Message.Should().Be(ErrorCodes.AccountBanned);
    }

    [Fact]
    public async Task LoginAsync_OnSuccess_ReturnsAccessAndRefreshTokens()
    {
        var user = CreateUser();
        _userRepository
            .Setup(r => r.GetByEmailOrUsernameAsync("student@test.local", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepository
            .Setup(r => r.ValidatePasswordAsync(user.Id, "ValidPass1!", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        SetupSuccessfulLoginMocks(user);

        var sut = CreateSut();
        var result = await sut.LoginAsync(new LoginRequest
        {
            EmailOrUsername = "student@test.local",
            Password = "ValidPass1!"
        });

        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("refresh-token-value");
        result.RefreshExpiresIn.Should().Be(7 * 86400);
        _refreshTokenRepository.Verify(
            r => r.AddAsync(It.Is<RefreshToken>(t => t.UserId == user.Id && t.Token == "refresh-token-value"), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_WithValidToken_RotatesAndReturnsNewPair()
    {
        var user = CreateUser();
        var stored = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = "old-refresh",
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };

        _refreshTokenRepository
            .Setup(r => r.FindByTokenValueAsync("old-refresh", It.IsAny<CancellationToken>()))
            .ReturnsAsync(stored);
        _userRepository
            .Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepository
            .Setup(r => r.IsCurrentlyBannedAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _subscriptionRepository
            .Setup(r => r.GetActiveByUserIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.Subscription?)null);
        _profileRepository
            .Setup(r => r.GetByUserIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Domain.Entities.UserProfile?)null);
        _jwtTokenService
            .Setup(s => s.GenerateAccessToken(user, false))
            .Returns(("new-access", 3600));
        _jwtTokenService
            .Setup(s => s.GenerateRefreshTokenValue())
            .Returns("new-refresh");
        _refreshTokenRepository
            .Setup(r => r.RevokeAsync(stored, It.IsAny<CancellationToken>()))
            .Callback<RefreshToken, CancellationToken>((token, _) => token.IsRevoked = true)
            .Returns(Task.CompletedTask);
        _refreshTokenRepository
            .Setup(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var sut = CreateSut();
        var result = await sut.RefreshAsync(new RefreshTokenRequest { RefreshToken = "old-refresh" });

        result.AccessToken.Should().Be("new-access");
        result.RefreshToken.Should().Be("new-refresh");
        stored.IsRevoked.Should().BeTrue();
        _refreshTokenRepository.Verify(r => r.RevokeAsync(stored, It.IsAny<CancellationToken>()), Times.Once);
        _refreshTokenRepository.Verify(r => r.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_WithRevokedToken_RevokesAllAndThrowsReuseDetected()
    {
        var stored = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Token = "revoked-refresh",
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            IsRevoked = true,
            CreatedAt = DateTime.UtcNow
        };

        _refreshTokenRepository
            .Setup(r => r.FindByTokenValueAsync("revoked-refresh", It.IsAny<CancellationToken>()))
            .ReturnsAsync(stored);
        _unitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var sut = CreateSut();
        var act = () => sut.RefreshAsync(new RefreshTokenRequest { RefreshToken = "revoked-refresh" });

        var exception = await act.Should().ThrowAsync<ForbiddenException>();
        exception.Which.Message.Should().Be(ErrorCodes.RefreshTokenReuseDetected);
        _refreshTokenRepository.Verify(r => r.RevokeAllForUserAsync(UserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_WithExpiredToken_ThrowsExpired()
    {
        var stored = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Token = "expired-refresh",
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow.AddDays(-8)
        };

        _refreshTokenRepository
            .Setup(r => r.FindByTokenValueAsync("expired-refresh", It.IsAny<CancellationToken>()))
            .ReturnsAsync(stored);

        var sut = CreateSut();
        var act = () => sut.RefreshAsync(new RefreshTokenRequest { RefreshToken = "expired-refresh" });

        var exception = await act.Should().ThrowAsync<ForbiddenException>();
        exception.Which.Message.Should().Be(ErrorCodes.RefreshTokenExpired);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithValidOtp_UpdatesPasswordAndConsumesOtp()
    {
        var user = CreateUser();
        _otpService
            .Setup(o => o.VerifyEmailAsync(user.Email, "123456", OtpPurpose.ForgotPassword, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _userRepository
            .Setup(r => r.GetByEmailAsync(user.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepository
            .Setup(r => r.UpdatePasswordAsync(user.Id, "New@Test123", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _otpService
            .Setup(o => o.ConsumeLatestEmailOtpAsync(user.Email, OtpPurpose.ForgotPassword, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _refreshTokenRepository
            .Setup(r => r.RevokeAllForUserAsync(user.Id, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _unitOfWork
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var sut = CreateSut();
        await sut.ResetPasswordAsync(new ResetPasswordRequest
        {
            Email = user.Email,
            Code = "123456",
            NewPassword = "New@Test123"
        });

        _otpService.Verify(o => o.VerifyEmailAsync(user.Email, "123456", OtpPurpose.ForgotPassword, false, It.IsAny<CancellationToken>()), Times.Once);
        _otpService.Verify(o => o.ConsumeLatestEmailOtpAsync(user.Email, OtpPurpose.ForgotPassword, It.IsAny<CancellationToken>()), Times.Once);
        _userRepository.Verify(r => r.UpdatePasswordAsync(user.Id, "New@Test123", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ResetPasswordAsync_WithInvalidOtp_ThrowsForbiddenException()
    {
        _otpService
            .Setup(o => o.VerifyEmailAsync(It.IsAny<string>(), It.IsAny<string>(), OtpPurpose.ForgotPassword, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var sut = CreateSut();
        var act = () => sut.ResetPasswordAsync(new ResetPasswordRequest
        {
            Email = "student@test.local",
            Code = "000000",
            NewPassword = "New@Test123"
        });

        var exception = await act.Should().ThrowAsync<ForbiddenException>();
        exception.Which.Message.Should().Be(ErrorCodes.OtpInvalid);
        _userRepository.Verify(r => r.UpdatePasswordAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _otpService.Verify(o => o.ConsumeLatestEmailOtpAsync(It.IsAny<string>(), It.IsAny<OtpPurpose>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GoogleAuthAsync_WithValidToken_ExistingUser_ReturnsTokens()
    {
        var user = CreateUser();
        _googleTokenValidator
            .Setup(v => v.ValidateAsync("valid-google-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Subject = "google-sub",
                Email = user.Email,
                Name = "Student",
                EmailVerified = true
            });
        _userRepository
            .Setup(r => r.FindOrCreateGoogleUserAsync(user.Email, "Student", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        SetupSuccessfulLoginMocks(user);

        var sut = CreateSut();
        var result = await sut.GoogleAuthAsync(new GoogleAuthRequest { IdToken = "valid-google-token" });

        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("refresh-token-value");
        _googleTokenValidator.Verify(v => v.ValidateAsync("valid-google-token", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GoogleAuthAsync_WithValidToken_NewUser_CallsFindOrCreate()
    {
        var user = new UserAccount
        {
            Id = UserId,
            Username = "newgoogle",
            Email = "newgoogle@test.local",
            DisplayName = "Google User",
            Role = RoleNames.Student,
            Points = 0,
            CreatedAt = DateTime.UtcNow
        };
        _googleTokenValidator
            .Setup(v => v.ValidateAsync("new-user-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Subject = "google-sub-new",
                Email = "newgoogle@test.local",
                Name = "Google User",
                EmailVerified = true
            });
        _userRepository
            .Setup(r => r.FindOrCreateGoogleUserAsync("newgoogle@test.local", "Google User", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        SetupSuccessfulLoginMocks(user);

        var sut = CreateSut();
        var result = await sut.GoogleAuthAsync(new GoogleAuthRequest { IdToken = "new-user-token" });

        result.AccessToken.Should().Be("access-token");
        _userRepository.Verify(
            r => r.FindOrCreateGoogleUserAsync("newgoogle@test.local", "Google User", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GoogleAuthAsync_WithInvalidToken_ThrowsForbiddenException()
    {
        _googleTokenValidator
            .Setup(v => v.ValidateAsync("bad-token", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ForbiddenException(ErrorCodes.GoogleTokenInvalid));

        var sut = CreateSut();
        var act = () => sut.GoogleAuthAsync(new GoogleAuthRequest { IdToken = "bad-token" });

        var exception = await act.Should().ThrowAsync<ForbiddenException>();
        exception.Which.Message.Should().Be(ErrorCodes.GoogleTokenInvalid);
        _userRepository.Verify(
            r => r.FindOrCreateGoogleUserAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GoogleAuthAsync_WhenUserIsBanned_ThrowsForbiddenException()
    {
        var user = CreateUser();
        _googleTokenValidator
            .Setup(v => v.ValidateAsync("valid-google-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleTokenPayload
            {
                Subject = "google-sub",
                Email = user.Email,
                Name = "Student",
                EmailVerified = true
            });
        _userRepository
            .Setup(r => r.FindOrCreateGoogleUserAsync(user.Email, "Student", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepository
            .Setup(r => r.IsCurrentlyBannedAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var sut = CreateSut();
        var act = () => sut.GoogleAuthAsync(new GoogleAuthRequest { IdToken = "valid-google-token" });

        var exception = await act.Should().ThrowAsync<ForbiddenException>();
        exception.Which.Message.Should().Be(ErrorCodes.AccountBanned);
    }

    private static UserAccount CreateUser() => new()
    {
        Id = UserId,
        Username = "student",
        Email = "student@test.local",
        DisplayName = "Student",
        Role = RoleNames.Student,
        Points = 0,
        CreatedAt = DateTime.UtcNow
    };
}
