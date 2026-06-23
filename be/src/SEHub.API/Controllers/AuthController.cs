using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SEHub.API.RateLimiting;
using SEHub.Application.Auth;
using SEHub.Contracts.Auth;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Register a new student account. Returns JWT + user profile (same shape as login).</summary>
    /// <response code="200">Registration successful</response>
    /// <response code="400">Validation failed (password policy, email format, username rules)</response>
    /// <response code="409">Email or username already exists</response>
    /// <response code="429">Rate limit exceeded</response>
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Register)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RegisterAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Login)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("google")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.GoogleLogin)]
    public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.GoogleAuthAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        await _authService.SendForgotPasswordOtpAsync(request, cancellationToken);
        return Ok(new { message = "OTP sent" });
    }

    [HttpPost("verify-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request, CancellationToken cancellationToken)
    {
        await _authService.VerifyOtpAsync(request, cancellationToken);
        return Ok(new { message = "OTP verified" });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        await _authService.ResetPasswordAsync(request, cancellationToken);
        return Ok(new { message = "Password reset successful" });
    }

    [HttpPost("send-email-verification")]
    [AllowAnonymous]
    public async Task<IActionResult> SendEmailVerification([FromBody] SendEmailVerificationRequest request, CancellationToken cancellationToken)
    {
        await _authService.SendEmailVerificationAsync(request, cancellationToken);
        return Ok(new { message = "Verification email sent" });
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        await _authService.VerifyEmailAsync(request, cancellationToken);
        return Ok(new { message = "Email verified" });
    }

    [HttpPost("send-sms-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> SendSmsOtp([FromBody] SendSmsOtpRequest request, CancellationToken cancellationToken)
    {
        await _authService.SendSmsOtpAsync(request, cancellationToken);
        return Ok(new { message = "SMS OTP sent" });
    }

    [HttpPost("verify-sms-otp")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifySmsOtp([FromBody] VerifySmsOtpRequest request, CancellationToken cancellationToken)
    {
        await _authService.VerifySmsOtpAsync(request, cancellationToken);
        return Ok(new { message = "SMS OTP verified" });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting(AuthRateLimitPolicies.Refresh)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.RefreshAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await _authService.LogoutAsync(cancellationToken);
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("me")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var result = await _authService.GetMeAsync(cancellationToken);
        return Ok(result);
    }
}
