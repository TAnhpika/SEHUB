using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.API.IntegrationTests.Moderation;

public sealed class ViolationsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ViolationsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task WarnBanAndUnban_FullViolationFlow_Succeeds()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var targetUserId = CustomWebApplicationFactory.FreeUserId;

        var warnResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetUserId}/warn",
            new ModeratorWarnUserRequest { Reason = "" });
        warnResponse.EnsureSuccessStatusCode();

        var listResponse = await _client.GetAsync(
            "/api/v1/admin/moderation/violations?status=warning&page=1&pageSize=20");
        listResponse.EnsureSuccessStatusCode();
        var listBody = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ViolatingUserDto>>>();
        listBody!.Data!.Items.Should().Contain(u => u.Id == targetUserId);

        var detailResponse = await _client.GetAsync($"/api/v1/admin/moderation/violations/{targetUserId}");
        detailResponse.EnsureSuccessStatusCode();
        var detailBody = await detailResponse.Content.ReadFromJsonAsync<ApiResponse<ViolatingUserDetailDto>>();
        detailBody!.Data!.ViolationCount.Should().BeGreaterThan(0);
        detailBody.Data.History.Should().NotBeEmpty();

        var banResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetUserId}/ban",
            new ModeratorBanUserRequest { DurationDays = 1, Reason = "Integration test temp ban." });
        banResponse.EnsureSuccessStatusCode();
        var banned = await banResponse.Content.ReadFromJsonAsync<ApiResponse<ViolatingUserDto>>();
        banned!.Data!.Status.Should().Be("locked");

        _client.DefaultRequestHeaders.Authorization = null;
        var loginWhileBanned = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { emailOrUsername = CustomWebApplicationFactory.FreeUserEmail, password = CustomWebApplicationFactory.FreeUserPassword });
        loginWhileBanned.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);
        var unbanResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetUserId}/unban",
            new UnbanUserRequest { Note = "Test complete" });
        unbanResponse.EnsureSuccessStatusCode();
        var unbanned = await unbanResponse.Content.ReadFromJsonAsync<ApiResponse<ViolatingUserDto>>();
        unbanned!.Data!.Status.Should().NotBe("locked");
    }

    [Fact]
    public async Task GetViolations_WithSortAndRank_ReturnsPagedResult()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var response = await _client.GetAsync(
            "/api/v1/admin/moderation/violations?sort=violations-desc&rank=bronze&page=1&pageSize=10");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ViolatingUserDto>>>();
        body!.Data.Should().NotBeNull();
    }
}
