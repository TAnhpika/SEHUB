using SEHub.Contracts.Auth;



namespace SEHub.Application.Auth;



public interface IAuthService

{

    Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<LoginResponse> GoogleAuthAsync(GoogleAuthRequest request, CancellationToken cancellationToken = default);

    Task SendForgotPasswordOtpAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);

    Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default);

    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);

    Task SendEmailVerificationAsync(SendEmailVerificationRequest request, CancellationToken cancellationToken = default);

    Task VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default);

    Task SendSmsOtpAsync(SendSmsOtpRequest request, CancellationToken cancellationToken = default);

    Task VerifySmsOtpAsync(VerifySmsOtpRequest request, CancellationToken cancellationToken = default);

    Task<LoginResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);

    Task LogoutAsync(CancellationToken cancellationToken = default);

    Task<MeResponse> GetMeAsync(CancellationToken cancellationToken = default);

}


