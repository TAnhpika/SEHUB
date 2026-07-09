using System.Diagnostics;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.API.IntegrationTests.Moderation;

public sealed class FeaturedPostsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public FeaturedPostsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Moderator_GetFeaturedPosts_ReturnsPinnedAndCandidates()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var response = await _client.GetAsync("/api/v1/admin/moderation/featured-posts?pageSize=10");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FeaturedPostsStateDto>>();
        body.Should().NotBeNull();
        body!.Data.Should().NotBeNull();
        body.Data!.Pinned.Should().NotBeNull();
        body.Data.Candidates.Should().NotBeNull();
        body.Data.MaxPinned.Should().BeGreaterThan(0);
        body.Data.Candidates.Count.Should().BeLessThanOrEqualTo(10);
    }

    [Fact]
    public async Task Moderator_GetFeaturedPosts_CompletesWithinReasonableTime()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var stopwatch = Stopwatch.StartNew();
        var response = await _client.GetAsync("/api/v1/admin/moderation/featured-posts?pageSize=20");
        stopwatch.Stop();

        response.EnsureSuccessStatusCode();
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000);
    }
}
