using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Common;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class GoogleAuthEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public GoogleAuthEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GoogleAuth_WithValidToken_ExistingUser_ReturnsLoginResponse()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.ValidExistingToken
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.Data.RefreshToken.Should().NotBeNullOrWhiteSpace();
        body.Data.User.Email.Should().Be(CustomWebApplicationFactory.FreeUserEmail);
    }

    [Fact]
    public async Task GoogleAuth_WithValidToken_NewUser_CreatesStudentAndReturnsLoginResponse()
    {
        await DeleteUserByEmailAsync("google-new@test.local");

        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.ValidNewUserToken
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        body.Should().NotBeNull();
        body!.Data!.User.Email.Should().Be("google-new@test.local");
        body.Data.User.Role.Should().Be("Student");

        await using var scope = _factory.Services.CreateAsyncScope();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var created = await userRepository.GetByEmailAsync("google-new@test.local");
        created.Should().NotBeNull();
        created!.EmailConfirmed.Should().BeTrue();

        await DeleteUserByEmailAsync("google-new@test.local");
    }

    [Fact]
    public async Task GoogleAuth_WithInvalidToken_ReturnsForbidden()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.InvalidToken
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GoogleAuth_WithExpiredToken_ReturnsForbidden()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.ExpiredToken
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GoogleAuth_WithWrongAudienceToken_ReturnsForbidden()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.WrongAudienceToken
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GoogleAuth_WithUnverifiedEmailToken_ReturnsForbidden()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.UnverifiedEmailToken
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GoogleAuth_GeneratesRefreshToken_AndRefreshRotates()
    {
        var googleResponse = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.ValidExistingToken
        });
        googleResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var googleBody = await googleResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        var refreshToken = googleBody!.Data!.RefreshToken;

        var refreshResponse = await _client.PostAsJsonAsync("/api/v1/auth/refresh", new RefreshTokenRequest
        {
            RefreshToken = refreshToken
        });

        refreshResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var refreshBody = await refreshResponse.Content.ReadFromJsonAsync<ApiResponse<LoginResponse>>();
        refreshBody!.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();
        refreshBody.Data.RefreshToken.Should().NotBe(refreshToken);
    }

    [Fact]
    public async Task GoogleAuth_DuplicateLogin_DoesNotCreateDuplicateAccounts()
    {
        await DeleteUserByEmailAsync("google-new@test.local");

        var first = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.ValidNewUserToken
        });
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        var second = await _client.PostAsJsonAsync("/api/v1/auth/google", new GoogleAuthRequest
        {
            IdToken = FakeGoogleTokenValidator.ValidNewUserToken
        });
        second.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var count = await context.Users.CountAsync(u => u.Email == "google-new@test.local");
        count.Should().Be(1);

        await DeleteUserByEmailAsync("google-new@test.local");
    }

    private async Task DeleteUserByEmailAsync(string email)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var users = await context.Users.Where(u => u.Email == email).ToListAsync();
        if (users.Count == 0)
        {
            return;
        }

        foreach (var user in users)
        {
            var refreshTokens = await context.RefreshTokens.Where(t => t.UserId == user.Id).ToListAsync();
            context.RefreshTokens.RemoveRange(refreshTokens);
            var profiles = await context.UserProfiles.Where(p => p.UserId == user.Id).ToListAsync();
            context.UserProfiles.RemoveRange(profiles);
            context.Users.Remove(user);
        }

        await context.SaveChangesAsync();
    }
}
