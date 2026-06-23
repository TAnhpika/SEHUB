using System.Net;
using System.Net.Http.Json;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Common;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class LoginRateLimitTests : IClassFixture<StrictRateLimitWebApplicationFactory>
{
    private readonly HttpClient _client;

    public LoginRateLimitTests(StrictRateLimitWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ExceedingFiveRequestsPerMinute_Returns429()
    {
        var request = new LoginRequest
        {
            EmailOrUsername = CustomWebApplicationFactory.FreeUserEmail,
            Password = "WrongPass1!"
        };

        for (var i = 0; i < 5; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/v1/auth/login", request);
            response.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
        }

        var limitedResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", request);
        limitedResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        var body = await limitedResponse.Content.ReadFromJsonAsync<ApiResponse<object?>>();
        body!.Success.Should().BeFalse();
        body.Errors.Should().ContainSingle(e => e.Message == ErrorCodes.AuthRateLimitExceeded);
    }
}

public sealed class RegisterRateLimitTests : IClassFixture<StrictRateLimitWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RegisterRateLimitTests(StrictRateLimitWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_ExceedingFiveRequestsPerMinute_Returns429()
    {
        for (var i = 0; i < 5; i++)
        {
            var request = new RegisterRequest
            {
                Email = $"ratelimit{i}@test.local",
                Username = $"rateuser{i}",
                Password = "Test@12345",
                DisplayName = $"Rate User {i}"
            };

            var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);
            response.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
        }

        var limitedRequest = new RegisterRequest
        {
            Email = "ratelimit-overflow@test.local",
            Username = "rateuser-overflow",
            Password = "Test@12345",
            DisplayName = "Rate User Overflow"
        };

        var limitedResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", limitedRequest);
        limitedResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        var body = await limitedResponse.Content.ReadFromJsonAsync<ApiResponse<object?>>();
        body!.Success.Should().BeFalse();
        body.Errors.Should().ContainSingle(e => e.Message == ErrorCodes.AuthRateLimitExceeded);
    }
}

public sealed class RefreshRateLimitTests : IClassFixture<StrictRateLimitWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RefreshRateLimitTests(StrictRateLimitWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Refresh_ExceedingTwentyRequestsPerMinute_Returns429()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            EmailOrUsername = CustomWebApplicationFactory.FreeUserEmail,
            Password = CustomWebApplicationFactory.FreeUserPassword
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        var refreshToken = loginBody!.Data!.RefreshToken;

        for (var i = 0; i < 20; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshTokenRequest
            {
                RefreshToken = refreshToken
            });

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var body = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
            refreshToken = body!.Data!.RefreshToken;
        }

        var limitedResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshTokenRequest
        {
            RefreshToken = refreshToken
        });

        limitedResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        var limitedBody = await limitedResponse.Content.ReadFromJsonAsync<ApiResponse<object?>>();
        limitedBody!.Success.Should().BeFalse();
        limitedBody.Errors.Should().ContainSingle(e => e.Message == ErrorCodes.AuthRateLimitExceeded);
    }
}
