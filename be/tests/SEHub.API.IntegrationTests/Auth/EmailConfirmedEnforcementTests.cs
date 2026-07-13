using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Common;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class EmailConfirmedEnforcementTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public EmailConfirmedEnforcementTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task UnconfirmedUser_MeAndLogoutAllowed_BusinessApiBlocked_RefreshKeepsSession_VerifyUnlocks()
    {
        _factory.EmailCapture.Reset();

        var email = $"unconfirmed.{Guid.NewGuid():N}@test.local";
        var username = $"uc{Guid.NewGuid():N}"[..16];
        var password = "Unconfirmed@Test1";

        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = email,
            Username = username,
            Password = password,
            DisplayName = "Unconfirmed User"
        });
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var registerBody = await registerResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        registerBody.Should().NotBeNull();
        registerBody!.Success.Should().BeTrue();
        registerBody.Data.Should().NotBeNull();
        registerBody.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        registerBody.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        registerBody.Data.User.EmailConfirmed.Should().BeFalse();

        var accessToken = registerBody.Data.AccessToken;
        var refreshToken = registerBody.Data.RefreshToken;

        using var meRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/me");
        meRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var meResponse = await _client.SendAsync(meRequest);
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var meBody = await meResponse.Content.ReadFromJsonAsync<ApiResponse<MeResponse>>();
        meBody!.Data!.EmailConfirmed.Should().BeFalse();

        using var blockedRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/notifications/unread-count");
        blockedRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var blockedResponse = await _client.SendAsync(blockedRequest);
        blockedResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var blockedBody = await blockedResponse.Content.ReadFromJsonAsync<ApiResponse<object?>>();
        blockedBody.Should().NotBeNull();
        blockedBody!.Success.Should().BeFalse();
        blockedBody.Message.Should().Be("Email chưa được xác thực");
        blockedBody.Errors.Should().Contain(e =>
            e.Field == "email" && e.Message == ErrorCodes.EmailNotConfirmed);

        using var hubRequest = new HttpRequestMessage(HttpMethod.Post, "/hubs/chat/negotiate?negotiateVersion=1");
        hubRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var hubResponse = await _client.SendAsync(hubRequest);
        hubResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var refreshResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshTokenRequest
        {
            RefreshToken = refreshToken
        });
        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var refreshBody = await refreshResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        refreshBody!.Data!.User.EmailConfirmed.Should().BeFalse();
        refreshBody.Data.AccessToken.Should().NotBeNullOrWhiteSpace();
        var refreshedAccess = refreshBody.Data.AccessToken;

        _factory.EmailCapture.Reset();
        var sendVerifyResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/send-email-verification",
            new SendEmailVerificationRequest { Email = email });
        sendVerifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        await WaitForOtpAsync();
        var otpCode = _factory.EmailCapture.LastOtpCode!;

        var verifyResponse = await _client.PostAsJsonAsync("/api/v1/auth/verify-email", new VerifyEmailRequest
        {
            Email = email,
            Code = otpCode
        });
        verifyResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var unlockedRequest = new HttpRequestMessage(HttpMethod.Get, "/api/v1/notifications/unread-count");
        unlockedRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", refreshedAccess);
        var unlockedResponse = await _client.SendAsync(unlockedRequest);
        unlockedResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logoutRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", refreshedAccess);
        var logoutResponse = await _client.SendAsync(logoutRequest);
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UnconfirmedUser_LogoutIsAllowlisted()
    {
        var email = $"logout.uc.{Guid.NewGuid():N}@test.local";
        var username = $"lo{Guid.NewGuid():N}"[..16];

        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = email,
            Username = username,
            Password = "Logout@Test1",
            DisplayName = "Logout Unconfirmed"
        });
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var registerBody = await registerResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        var accessToken = registerBody!.Data!.AccessToken;

        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logoutRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var logoutResponse = await _client.SendAsync(logoutRequest);
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private async Task WaitForOtpAsync()
    {
        for (var i = 0; i < 50; i++)
        {
            if (!string.IsNullOrWhiteSpace(_factory.EmailCapture.LastOtpCode))
            {
                return;
            }

            await Task.Delay(50);
        }

        _factory.EmailCapture.LastOtpCode.Should().NotBeNullOrWhiteSpace();
    }
}
