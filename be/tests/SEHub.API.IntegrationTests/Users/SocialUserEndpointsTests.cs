using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Common;
using SEHub.Contracts.Users;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Users;

public sealed class SocialUserEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    public static readonly Guid TargetUserId = Guid.Parse("88888888-8888-8888-8888-888888888888");
    public const string TargetUsername = "searchtarget";
    public const string TargetDisplayName = "Search Target User";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SocialUserEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SearchUsers_ByUsername_ReturnsMatch()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        using var request = CreateAuthorizedGet(
            token,
            $"/api/v1/users/search?q={TargetUsername}&page=1&pageSize=10");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<UserSearchResultDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data!.Items.Should().ContainSingle(item =>
            item.Username == TargetUsername && item.FullName == TargetDisplayName);
    }

    [Fact]
    public async Task SearchUsers_ByFullNamePartial_ReturnsMatch()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        using var request = CreateAuthorizedGet(token, "/api/v1/users/search?q=target%20user");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<UserSearchResultDto>>>();
        body!.Data!.Items.Should().Contain(item => item.UserId == TargetUserId);
    }

    [Fact]
    public async Task SearchUsers_WhenNoMatch_ReturnsEmptyPage()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        using var request = CreateAuthorizedGet(token, "/api/v1/users/search?q=zzzznotfound999");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<UserSearchResultDto>>>();
        body!.Data!.Items.Should().BeEmpty();
        body.Data.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task FollowUser_ThenUnfollow_UpdatesCounts()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);

        using (var followRequest = CreateAuthorizedPost(token, $"/api/v1/users/{TargetUserId}/follow"))
        {
            var followResponse = await _client.SendAsync(followRequest);
            followResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var followBody = await followResponse.Content.ReadFromJsonAsync<ApiResponse<FollowActionResultDto>>();
            followBody!.Data!.IsFollowing.Should().BeTrue();
            followBody.Data.FollowersCount.Should().Be(1);
        }

        using (var statusRequest = CreateAuthorizedGet(token, $"/api/v1/users/{TargetUserId}/follow-status"))
        {
            var statusResponse = await _client.SendAsync(statusRequest);
            var statusBody = await statusResponse.Content.ReadFromJsonAsync<ApiResponse<FollowStatusDto>>();
            statusBody!.Data!.IsFollowing.Should().BeTrue();
            statusBody.Data.FollowersCount.Should().Be(1);
        }

        using (var unfollowRequest = CreateAuthorizedDelete(token, $"/api/v1/users/{TargetUserId}/follow"))
        {
            var unfollowResponse = await _client.SendAsync(unfollowRequest);
            unfollowResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var unfollowBody = await unfollowResponse.Content.ReadFromJsonAsync<ApiResponse<FollowActionResultDto>>();
            unfollowBody!.Data!.IsFollowing.Should().BeFalse();
            unfollowBody.Data.FollowersCount.Should().Be(0);
        }
    }

    [Fact]
    public async Task FollowUser_WhenAlreadyFollowing_IsIdempotent()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);

        using var first = CreateAuthorizedPost(token, $"/api/v1/users/{TargetUserId}/follow");
        (await _client.SendAsync(first)).EnsureSuccessStatusCode();

        using var second = CreateAuthorizedPost(token, $"/api/v1/users/{TargetUserId}/follow");
        var response = await _client.SendAsync(second);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FollowActionResultDto>>();
        body!.Data!.IsFollowing.Should().BeTrue();
        body.Data.FollowersCount.Should().Be(1);
    }

    [Fact]
    public async Task FollowSelf_ReturnsBadRequest()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);

        using var request = CreateAuthorizedPost(token, $"/api/v1/users/{CustomWebApplicationFactory.FreeUserId}/follow");
        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task SeedTargetUserAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        if (await userManager.FindByIdAsync(TargetUserId.ToString()) is not null)
        {
            return;
        }

        var bronzeLevel = await context.LevelConfigs.OrderBy(l => l.MinPoints).FirstAsync();

        var user = new ApplicationUser
        {
            Id = TargetUserId,
            UserName = TargetUsername,
            Email = "searchtarget@test.local",
            EmailConfirmed = true,
            DisplayName = TargetDisplayName,
            LevelId = bronzeLevel.Id
        };

        await userManager.CreateAsync(user, "Target@Test123");
        await userManager.AddToRoleAsync(user, RoleNames.Student);

        context.UserProfiles.Add(new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = TargetUserId,
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
    }

    private static HttpRequestMessage CreateAuthorizedGet(string token, string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private static HttpRequestMessage CreateAuthorizedPost(string token, string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(string.Empty, Encoding.UTF8, "application/json");
        return request;
    }

    private static HttpRequestMessage CreateAuthorizedDelete(string token, string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }
}
