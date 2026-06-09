using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Common;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class AuthEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ThenGetMe_ReturnsAuthenticatedProfile()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            EmailOrUsername = CustomWebApplicationFactory.FreeUserEmail,
            Password = CustomWebApplicationFactory.FreeUserPassword
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginBody = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        loginBody.Should().NotBeNull();
        loginBody!.Success.Should().BeTrue();
        loginBody.Data.Should().NotBeNull();
        loginBody.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        loginBody.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        loginBody.Data.RefreshExpiresIn.Should().BeGreaterThan(0);
        loginBody.Data.User.Id.Should().Be(CustomWebApplicationFactory.FreeUserId);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(loginBody.Data.AccessToken);
        jwt.Subject.Should().Be(CustomWebApplicationFactory.FreeUserId.ToString());

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", loginBody.Data.AccessToken);

        var meResponse = await _client.GetAsync("/api/v1/auth/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var meBody = await meResponse.Content.ReadFromJsonAsync<ApiResponse<MeResponse>>();
        meBody.Should().NotBeNull();
        meBody!.Success.Should().BeTrue();
        meBody.Data.Should().NotBeNull();
        meBody.Data!.Email.Should().Be(CustomWebApplicationFactory.FreeUserEmail);
        meBody.Data.Id.Should().Be(CustomWebApplicationFactory.FreeUserId);
        meBody.Data.IsPremium.Should().BeFalse();
    }

    [Fact]
    public async Task Login_ThenRefresh_ReturnsNewAccessTokenAndRotatesRefresh()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            EmailOrUsername = CustomWebApplicationFactory.FreeUserEmail,
            Password = CustomWebApplicationFactory.FreeUserPassword
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        loginBody!.Data!.RefreshToken.Should().NotBeNullOrWhiteSpace();
        var originalRefresh = loginBody.Data.RefreshToken;

        var refreshResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshTokenRequest
        {
            RefreshToken = originalRefresh
        });

        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var refreshBody = await refreshResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        refreshBody!.Success.Should().BeTrue();
        refreshBody.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        refreshBody.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        refreshBody.Data.RefreshToken.Should().NotBe(originalRefresh);

        var reuseResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshTokenRequest
        {
            RefreshToken = originalRefresh
        });

        reuseResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Register_WeakPassword_Returns400WithValidationErrors()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = "weak.validation@test.local",
            Username = "weakvalidation",
            Password = "hauvip123",
            DisplayName = "Weak Validation"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<object?>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeFalse();
        body.Data.Should().BeNull();
        body.Message.Should().Be("Dữ liệu không hợp lệ");
        body.Errors.Should().Contain(e => e.Field == "password");
        body.Errors.Should().Contain(e =>
            e.Message.Contains("uppercase", StringComparison.OrdinalIgnoreCase));
    }
}
