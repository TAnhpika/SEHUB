using AutoMapper;

using Microsoft.Extensions.DependencyInjection;

using Microsoft.Extensions.Logging;

using Microsoft.Extensions.Options;

using SEHub.Application.Abstractions;

using SEHub.Application.Abstractions.Repositories;

using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Events;
using SEHub.Application.Premium;
using SEHub.Application.Notifications;
using SEHub.Application.Profiles;

using SEHub.Application.Models;

using SEHub.Application.Users;

using SEHub.Contracts.Auth;

using SEHub.Domain.Entities;

using SEHub.Domain.Enums;

using SEHub.Domain.Exceptions;

using SEHub.Shared.Constants;



namespace SEHub.Application.Auth;



public sealed class AuthService : IAuthService

{

    private readonly IUserRepository _userRepository;

    private readonly IUserProfileRepository _profileRepository;

    private readonly ISubscriptionRepository _subscriptionRepository;

    private readonly IRefreshTokenRepository _refreshTokenRepository;

    private readonly IJwtTokenService _jwtTokenService;

    private readonly IOtpService _otpService;

    private readonly IGoogleTokenValidator _googleTokenValidator;

    private readonly ICurrentUserService _currentUser;

    private readonly IUnitOfWork _unitOfWork;

    private readonly IMapper _mapper;

    private readonly AuthSettings _authSettings;

    private readonly JwtSettings _jwtSettings;

    private readonly IGamificationEventPublisher _gamificationPublisher;
    private readonly IProfileStatsService _profileStatsService;
    private readonly IPremiumService _premiumService;
    private readonly IAiTokenService _aiTokenService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuthService> _logger;
    private readonly IBanStatusService _banStatusService;
    private readonly IAccountPenaltyService _accountPenaltyService;
    private readonly IWorkflowNotificationService _workflowNotifications;



    public AuthService(

        IUserRepository userRepository,

        IUserProfileRepository profileRepository,

        ISubscriptionRepository subscriptionRepository,

        IRefreshTokenRepository refreshTokenRepository,

        IJwtTokenService jwtTokenService,

        IOtpService otpService,

        IGoogleTokenValidator googleTokenValidator,

        ICurrentUserService currentUser,

        IUnitOfWork unitOfWork,

        IMapper mapper,

        IOptions<AuthSettings> authSettings,

        IOptions<JwtSettings> jwtSettings,

        IGamificationEventPublisher gamificationPublisher,

        IProfileStatsService profileStatsService,

        IPremiumService premiumService,

        IAiTokenService aiTokenService,

        IServiceScopeFactory scopeFactory,

        ILogger<AuthService> logger,

        IBanStatusService banStatusService,

        IAccountPenaltyService accountPenaltyService,

        IWorkflowNotificationService workflowNotifications)

    {

        _userRepository = userRepository;

        _profileRepository = profileRepository;

        _subscriptionRepository = subscriptionRepository;

        _refreshTokenRepository = refreshTokenRepository;

        _jwtTokenService = jwtTokenService;

        _otpService = otpService;

        _googleTokenValidator = googleTokenValidator;

        _currentUser = currentUser;

        _unitOfWork = unitOfWork;

        _mapper = mapper;

        _authSettings = authSettings.Value;

        _jwtSettings = jwtSettings.Value;

        _gamificationPublisher = gamificationPublisher;

        _profileStatsService = profileStatsService;

        _premiumService = premiumService;

        _aiTokenService = aiTokenService;

        _scopeFactory = scopeFactory;

        _logger = logger;

        _banStatusService = banStatusService;

        _accountPenaltyService = accountPenaltyService;

        _workflowNotifications = workflowNotifications;

    }



    public async Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)

    {

        if (await _userRepository.GetByEmailAsync(request.Email, cancellationToken) is not null)

        {

            throw new ConflictException("Email is already registered.");

        }



        if (await _userRepository.GetByUsernameAsync(request.Username, cancellationToken) is not null)

        {

            throw new ConflictException("Username is already taken.");

        }



        var user = await _userRepository.CreateAsync(new CreateUserModel

        {

            Email = request.Email,

            Username = request.Username,

            Password = request.Password,

            DisplayName = request.DisplayName ?? request.Username

        }, cancellationToken);



        await _profileRepository.AddAsync(new UserProfile

        {

            Id = Guid.NewGuid(),

            UserId = user.Id,

            CreatedAt = DateTime.UtcNow

        }, cancellationToken);



        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var response = await BuildLoginResponseAsync(user, cancellationToken);

        QueueVerificationEmail(request.Email);

        return response;

    }



    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)

    {

        var user = await _userRepository.GetByEmailOrUsernameAsync(request.EmailOrUsername, cancellationToken)

            ?? throw new NotFoundException("Invalid credentials.");



        if (!await _userRepository.ValidatePasswordAsync(user.Id, request.Password, cancellationToken))

        {

            throw new NotFoundException("Invalid credentials.");

        }



        // Allow login when email is unconfirmed; EmailConfirmedMiddleware blocks business APIs until verified.

        await EnsureNotBannedAsync(user.Id, cancellationToken);

        await TryPublishDailyLoginAsync(user.Id, cancellationToken);

        user = await _userRepository.GetByIdAsync(user.Id, cancellationToken) ?? user;

        return await BuildLoginResponseAsync(user, cancellationToken);

    }



    public async Task<LoginResponse> GoogleAuthAsync(GoogleAuthRequest request, CancellationToken cancellationToken = default)

    {

        var payload = await _googleTokenValidator.ValidateAsync(request.IdToken, cancellationToken);



        var user = await _userRepository.FindOrCreateGoogleUserAsync(payload.Email, payload.Name, cancellationToken)

            ?? throw new NotFoundException("Unable to authenticate with Google.");



        if (!user.EmailConfirmed)

        {

            await _userRepository.ConfirmEmailAsync(user.Id, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            user = await _userRepository.GetByIdAsync(user.Id, cancellationToken) ?? user;

        }



        await EnsureNotBannedAsync(user.Id, cancellationToken);

        await TryPublishDailyLoginAsync(user.Id, cancellationToken);



        user = await _userRepository.GetByIdAsync(user.Id, cancellationToken) ?? user;

        return await BuildLoginResponseAsync(user, cancellationToken);

    }



    public async Task SendForgotPasswordOtpAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)

    {

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user is null)

        {

            return;

        }



        await _otpService.GenerateAndSendAsync(request.Email, cancellationToken);

    }



    public async Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default)

    {

        var isValid = await _otpService.VerifyAsync(request.Email, request.Code, cancellationToken);

        if (!isValid)

        {

            throw new ForbiddenException(ErrorCodes.OtpInvalid);

        }

    }



    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)

    {

        var isValid = await _otpService.VerifyEmailAsync(

            request.Email,

            request.Code,

            OtpPurpose.ForgotPassword,

            markUsed: false,

            cancellationToken);



        if (!isValid)

        {

            throw new ForbiddenException(ErrorCodes.OtpInvalid);

        }



        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken)

            ?? throw new NotFoundException("User", Guid.Empty);



        await _userRepository.UpdatePasswordAsync(user.Id, request.NewPassword, cancellationToken);

        await _otpService.ConsumeLatestEmailOtpAsync(request.Email, OtpPurpose.ForgotPassword, cancellationToken);

        await _refreshTokenRepository.RevokeAllForUserAsync(user.Id, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

    }



    public async Task SendEmailVerificationAsync(SendEmailVerificationRequest request, CancellationToken cancellationToken = default)

    {

        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);

        if (user is null || user.EmailConfirmed)

        {

            return;

        }



        await _otpService.GenerateAndSendEmailAsync(request.Email, OtpPurpose.EmailVerification, cancellationToken);

    }



    public async Task VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default)

    {

        var isValid = await _otpService.VerifyEmailAsync(

            request.Email,

            request.Code,

            OtpPurpose.EmailVerification,

            markUsed: true,

            cancellationToken);



        if (!isValid)

        {

            throw new ForbiddenException(ErrorCodes.OtpInvalid);

        }



        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken)

            ?? throw new NotFoundException("User", Guid.Empty);



        if (!user.EmailConfirmed)

        {

            await _userRepository.ConfirmEmailAsync(user.Id, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

        }

    }



    public async Task SendSmsOtpAsync(SendSmsOtpRequest request, CancellationToken cancellationToken = default)

    {

        await _otpService.GenerateAndSendSmsAsync(request.Phone, OtpPurpose.SmsVerification, cancellationToken);

    }



    public async Task VerifySmsOtpAsync(VerifySmsOtpRequest request, CancellationToken cancellationToken = default)

    {

        var isValid = await _otpService.VerifySmsAsync(

            request.Phone,

            request.Code,

            OtpPurpose.SmsVerification,

            markUsed: true,

            cancellationToken);



        if (!isValid)

        {

            throw new ForbiddenException(ErrorCodes.OtpInvalid);

        }



        if (_currentUser.UserId is Guid userId)

        {

            await _userRepository.UpdatePhoneNumberAsync(userId, request.Phone, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

        }

    }



    public async Task<LoginResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)

    {

        var stored = await _refreshTokenRepository.FindByTokenValueAsync(request.RefreshToken, cancellationToken);

        if (stored is null)

        {

            throw new ForbiddenException(ErrorCodes.RefreshTokenInvalid);

        }



        if (stored.IsRevoked)

        {

            await _refreshTokenRepository.RevokeAllForUserAsync(stored.UserId, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            throw new ForbiddenException(ErrorCodes.RefreshTokenReuseDetected);

        }



        if (stored.ExpiresAt < DateTime.UtcNow)

        {

            throw new ForbiddenException(ErrorCodes.RefreshTokenExpired);

        }



        var user = await _userRepository.GetByIdAsync(stored.UserId, cancellationToken)

            ?? throw new ForbiddenException(ErrorCodes.RefreshTokenInvalid);



        // Intentionally do not reject unconfirmed email here: keep verify-email session alive.

        // Business APIs are blocked by EmailConfirmedMiddleware; response still includes EmailConfirmed.

        await EnsureNotBannedAsync(user.Id, cancellationToken);



        await _refreshTokenRepository.RevokeAsync(stored, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);



        return await BuildLoginResponseAsync(user, cancellationToken);

    }



    public async Task LogoutAsync(CancellationToken cancellationToken = default)

    {

        if (_currentUser.UserId is not Guid userId)

        {

            throw new ForbiddenException("User is not authenticated.");

        }



        await _refreshTokenRepository.RevokeAllForUserAsync(userId, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

    }



    public async Task<MeResponse> GetMeAsync(CancellationToken cancellationToken = default)

    {

        if (_currentUser.UserId is not Guid userId)

        {

            throw new ForbiddenException("User is not authenticated.");

        }



        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)

            ?? throw new NotFoundException("User", userId);



        await EnsureNotBannedAsync(userId, cancellationToken);



        var isPremium = await IsPremiumAsync(userId, cancellationToken);

        var profile = await _profileRepository.GetByUserIdAsync(userId, cancellationToken);

        var authUser = BuildAuthUserDto(user, isPremium, profile);

        var stats = await _profileStatsService.GetMyStatsAsync(cancellationToken);
        var subscription = await _premiumService.GetSubscriptionAsync(cancellationToken);
        var aiTokens = await _aiTokenService.GetStatusAsync(userId, cancellationToken);

        await _workflowNotifications.EnsureModeratorWelcomeNotificationAsync(userId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);



        return new MeResponse

        {

            Id = authUser.Id,

            Username = authUser.Username,

            Email = authUser.Email,

            DisplayName = authUser.DisplayName,

            Role = authUser.Role,

            IsPremium = authUser.IsPremium,

            AvatarUrl = authUser.AvatarUrl,

            Points = authUser.Points,

            LevelName = authUser.LevelName,

            EmailConfirmed = authUser.EmailConfirmed,

            IsProfileComplete = authUser.IsProfileComplete,

            Stats = stats,

            Subscription = subscription,

            AiTokens = aiTokens

        };

    }



    private async Task<LoginResponse> BuildLoginResponseAsync(UserAccount user, CancellationToken cancellationToken)

    {

        var isPremium = await IsPremiumAsync(user.Id, cancellationToken);

        var (accessToken, expiresIn) = _jwtTokenService.GenerateAccessToken(user, isPremium);

        var refreshTokenValue = _jwtTokenService.GenerateRefreshTokenValue();

        var refreshExpiresIn = _jwtSettings.RefreshExpirationDays * 86400;

        var profile = await _profileRepository.GetByUserIdAsync(user.Id, cancellationToken);



        await _refreshTokenRepository.AddAsync(new RefreshToken

        {

            Id = Guid.NewGuid(),

            UserId = user.Id,

            Token = refreshTokenValue,

            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshExpirationDays),

            IsRevoked = false,

            CreatedAt = DateTime.UtcNow

        }, cancellationToken);



        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _workflowNotifications.EnsureModeratorWelcomeNotificationAsync(user.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);



        return new LoginResponse

        {

            AccessToken = accessToken,

            ExpiresIn = expiresIn,

            RefreshToken = refreshTokenValue,

            RefreshExpiresIn = refreshExpiresIn,

            User = BuildAuthUserDto(user, isPremium, profile)

        };

    }



    private AuthUserDto BuildAuthUserDto(UserAccount user, bool isPremium, UserProfile? profile)

    {

        var dto = _mapper.Map<AuthUserDto>(user);

        return new AuthUserDto

        {

            Id = dto.Id,

            Username = dto.Username,

            Email = dto.Email,

            DisplayName = dto.DisplayName,

            Role = dto.Role,

            IsPremium = isPremium,

            AvatarUrl = profile?.AvatarUrl,

            Points = dto.Points,

            LevelName = dto.LevelName,

            EmailConfirmed = user.EmailConfirmed,

            IsProfileComplete = ProfileCompleteness.IsComplete(user.DisplayName, profile)

        };

    }



    private async Task<bool> IsPremiumAsync(Guid userId, CancellationToken cancellationToken)

    {

        var subscription = await _subscriptionRepository.GetActiveByUserIdAsync(userId, cancellationToken);

        return subscription is not null && subscription.IsActive && subscription.EndAt > DateTime.UtcNow;

    }



    private async Task EnsureNotBannedAsync(Guid userId, CancellationToken cancellationToken)

    {

        if (!await _userRepository.IsCurrentlyBannedAsync(userId, cancellationToken))

        {

            return;

        }



        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)

            ?? throw new NotFoundException("User", userId);

        var banRecord = await _banStatusService.GetActiveBanAsync(userId, cancellationToken);

        var penalty = _accountPenaltyService.MapFromActiveBan(user, banRecord);

        throw new AccountBannedException(penalty);

    }



    private void QueueVerificationEmail(string email)

    {

        _ = Task.Run(async () =>

        {

            try

            {

                using var scope = _scopeFactory.CreateScope();

                var otpService = scope.ServiceProvider.GetRequiredService<IOtpService>();

                await otpService.GenerateAndSendEmailAsync(email, OtpPurpose.EmailVerification);

            }

            catch (Exception ex)

            {

                _logger.LogWarning(ex, "Failed to send verification email to {Email} during registration", email);

            }

        });

    }



    private async Task TryPublishDailyLoginAsync(Guid userId, CancellationToken cancellationToken)

    {

        try

        {

            await _gamificationPublisher.PublishAsync(new DailyLoginEvent(userId), cancellationToken);

        }

        catch (Exception ex)

        {

            _logger.LogWarning(ex, "Daily login gamification skipped for user {UserId}", userId);

        }

    }

}


