using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Domain.Enums;

namespace SEHub.API.IntegrationTests.Feed;

public sealed class PostsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PostsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateLikeCommentAndReport_FullFeedFlow_Succeeds()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = "Integration Feed Flow",
            Content = "End-to-end feed test content.",
            Tags = ["integration", "feed"]
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        var postId = created!.Data!.Id;
        created.Data.Status.Should().Be(nameof(PostStatus.Pending));

        var likeResponse = await _client.PostAsync($"/api/v1/posts/{postId}/like", null);
        likeResponse.EnsureSuccessStatusCode();

        var duplicateLike = await _client.PostAsync($"/api/v1/posts/{postId}/like", null);
        duplicateLike.EnsureSuccessStatusCode();

        var commentResponse = await _client.PostAsJsonAsync(
            $"/api/v1/posts/{postId}/comments",
            new CreateCommentRequest { Content = "Great post!" });
        commentResponse.EnsureSuccessStatusCode();

        var commentsResponse = await _client.GetAsync($"/api/v1/posts/{postId}/comments");
        var commentsBody = await commentsResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<CommentDto>>>();
        commentsBody!.Data!.Items.Should().Contain(c => c.Content == "Great post!");

        var reportResponse = await _client.PostAsJsonAsync(
            $"/api/v1/posts/{postId}/report",
            new ReportPostRequest { Reason = "Spam content for test" });
        reportResponse.EnsureSuccessStatusCode();

        var duplicateReport = await _client.PostAsJsonAsync(
            $"/api/v1/posts/{postId}/report",
            new ReportPostRequest { Reason = "Duplicate report" });
        duplicateReport.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetPosts_WithTagFilter_ReturnsMatchingPosts()
    {
        var response = await _client.GetAsync("/api/v1/posts?tag=csharp&page=1&pageSize=20");

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<PostListItemDto>>>();
        body!.Data!.Items.Should().Contain(p => p.Title == CustomWebApplicationFactory.TaggedPostTitle);
    }

    [Fact]
    public async Task GetPosts_WithMajorAndSemesterFilter_ReturnsAuthorPosts()
    {
        var response = await _client.GetAsync("/api/v1/posts?major=SE&semester=1&page=1&pageSize=20");

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<PostListItemDto>>>();
        body!.Data!.Items.Should().NotBeEmpty();
        body.Data.Items.Should().OnlyContain(p => p.Author.Username == "freeuser");
    }

    [Fact]
    public async Task UpdateRejectedPost_MovesStatusToPending()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PutAsJsonAsync(
            $"/api/v1/posts/{CustomWebApplicationFactory.RejectedPostId}",
            new UpdatePostRequest
            {
                Title = "Resubmitted Post",
                Content = "Updated after moderator rejection.",
                Tags = ["resubmit"]
            });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        body!.Data!.Status.Should().Be(nameof(PostStatus.Pending));
        body.Data.Title.Should().Be("Resubmitted Post");
    }
}
