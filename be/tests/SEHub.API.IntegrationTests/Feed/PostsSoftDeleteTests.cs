using System.Net.Http.Json;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;

namespace SEHub.API.IntegrationTests.Feed;

public sealed class PostsSoftDeleteTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PostsSoftDeleteTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetPosts_DoesNotReturnSoftDeletedPosts()
    {
        var response = await _client.GetAsync("/api/v1/posts");

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<PostListItemDto>>>();
        body.Should().NotBeNull();
        body!.Data!.Items.Should().NotContain(p =>
            p.Title == CustomWebApplicationFactory.SoftDeletedPostTitle);
    }
}
