using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Auth;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Common;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class ForgotPasswordEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private const string OtpCode = "123456";
    private const string NewPassword = "New@Test123";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ForgotPasswordEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ForgotPasswordFlow_VerifyOtp_ResetPassword_LoginWithNewPassword_Succeeds()
    {
        var forgotResponse = await _client.PostAsJsonAsync("/api/v1/auth/forgot-password", new ForgotPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail
        });
        forgotResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        _factory.EmailCapture.LastOtpCode.Should().NotBeNullOrWhiteSpace();
        var otpCode = _factory.EmailCapture.LastOtpCode!;

        var verifyResponse = await _client.PostAsJsonAsync("/api/v1/auth/verify-otp", new VerifyOtpRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = otpCode
        });
        verifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var resetResponse = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = otpCode,
            NewPassword = NewPassword
        });
        resetResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            EmailOrUsername = CustomWebApplicationFactory.FreeUserEmail,
            Password = NewPassword
        });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginBody = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        loginBody.Should().NotBeNull();
        loginBody!.Success.Should().BeTrue();
        loginBody.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();

        var oldPasswordLogin = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            EmailOrUsername = CustomWebApplicationFactory.FreeUserEmail,
            Password = CustomWebApplicationFactory.FreeUserPassword
        });
        oldPasswordLogin.StatusCode.Should().Be(HttpStatusCode.NotFound);

        await RestoreFreeUserPasswordAsync();
    }

    [Fact]
    public async Task VerifyOtp_WithValidCode_ReturnsOk()
    {
        await SeedForgotPasswordOtpAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/verify-otp", new VerifyOtpRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = OtpCode
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ResetPassword_WithValidOtp_ReturnsOk()
    {
        await SeedForgotPasswordOtpAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = OtpCode,
            NewPassword = NewPassword
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        await RestoreFreeUserPasswordAsync();
    }

    [Fact]
    public async Task ResetPassword_WithExpiredOtp_ReturnsBadRequest()
    {
        await SeedForgotPasswordOtpAsync(expiresAt: DateTime.UtcNow.AddMinutes(-1));

        var response = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = OtpCode,
            NewPassword = NewPassword
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertOtpErrorAsync(response);
    }

    [Fact]
    public async Task VerifyOtp_WithInvalidCode_ReturnsBadRequest()
    {
        await SeedForgotPasswordOtpAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/verify-otp", new VerifyOtpRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = "000000"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertOtpErrorAsync(response);
    }

    [Fact]
    public async Task ResetPassword_WithReusedOtp_ReturnsBadRequest()
    {
        await SeedForgotPasswordOtpAsync();

        var firstReset = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = OtpCode,
            NewPassword = NewPassword
        });
        firstReset.StatusCode.Should().Be(HttpStatusCode.OK);

        var secondReset = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = OtpCode,
            NewPassword = "Another@Test456"
        });

        secondReset.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await AssertOtpErrorAsync(secondReset);

        await RestoreFreeUserPasswordAsync();
    }

    [Fact]
    public async Task ResetPassword_WithWeakPassword_ReturnsBadRequestNotServerError()
    {
        await SeedForgotPasswordOtpAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = OtpCode,
            NewPassword = "password1"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<object?>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeFalse();
        body.Message.Should().NotBe("Đã xảy ra lỗi hệ thống");
    }

    [Fact]
    public async Task ResetPassword_WithWeakPassword_DoesNotConsumeOtp()
    {
        await SeedForgotPasswordOtpAsync();

        var weakPasswordResponse = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = OtpCode,
            NewPassword = "password1"
        });
        weakPasswordResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var resetResponse = await _client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequest
        {
            Email = CustomWebApplicationFactory.FreeUserEmail,
            Code = OtpCode,
            NewPassword = NewPassword
        });
        resetResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        await RestoreFreeUserPasswordAsync();
    }

    private async Task RestoreFreeUserPasswordAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        await userRepository.UpdatePasswordAsync(
            CustomWebApplicationFactory.FreeUserId,
            CustomWebApplicationFactory.FreeUserPassword);
    }

    private async Task SeedForgotPasswordOtpAsync(DateTime? expiresAt = null)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var otpService = scope.ServiceProvider.GetRequiredService<IOtpService>();
        var otpRepository = scope.ServiceProvider.GetRequiredService<IOtpVerificationRepository>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var normalizedEmail = CustomWebApplicationFactory.FreeUserEmail.Trim().ToLowerInvariant();
        await otpRepository.InvalidateAllByEmailAsync(normalizedEmail, OtpPurpose.ForgotPassword);

        var otp = new OtpVerification
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            Phone = null,
            CodeHash = otpService.HashCode(OtpCode),
            ExpiresAt = expiresAt ?? DateTime.UtcNow.AddMinutes(10),
            AttemptCount = 0,
            IsUsed = false,
            Purpose = OtpPurpose.ForgotPassword,
            CreatedAt = DateTime.UtcNow
        };

        await otpRepository.AddAsync(otp);
        await unitOfWork.SaveChangesAsync();
    }

    private static async Task AssertOtpErrorAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<object?>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeFalse();
        body.Errors.Should().Contain(e => e.Message == ErrorCodes.OtpInvalid || e.Field == "otp");
    }
}
