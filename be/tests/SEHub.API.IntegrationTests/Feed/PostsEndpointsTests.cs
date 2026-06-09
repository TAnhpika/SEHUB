using System.Net;
using System.Net.Http.Json;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;

namespace SEHub.API.IntegrationTests.Feed;

public sealed class PostsEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PostsEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetPosts_WithoutAuthentication_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/posts");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<PostListItemDto>>>();
        body.Should().NotBeNull();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
        body.Data!.Items.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetFeatured_WithoutAuthentication_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/v1/posts/featured");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreatePost_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = "Unauthorized Post",
            Content = "Should not be created without auth."
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task LikePost_WithoutToken_ReturnsUnauthorized()
    {
        var listResponse = await _client.GetAsync("/api/v1/posts");
        var listBody = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<PostListItemDto>>>();
        var postId = listBody!.Data!.Items[0].Id;

        var response = await _client.PostAsync($"/api/v1/posts/{postId}/like", null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
