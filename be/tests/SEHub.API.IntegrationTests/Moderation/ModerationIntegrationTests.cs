using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Domain.Enums;

namespace SEHub.API.IntegrationTests.Moderation;

public sealed class ModerationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ModerationIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreatePost_StartsAsPending_AndHiddenFromPublicFeed()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = "Pending Integration Post",
            Content = "Awaiting moderator approval.",
            Tags = ["pending-test"]
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        created!.Data!.Status.Should().Be(nameof(PostStatus.Pending));

        _client.DefaultRequestHeaders.Authorization = null;
        var publicFeed = await _client.GetAsync("/api/v1/posts?search=Pending+Integration+Post");
        var feedBody = await publicFeed.Content.ReadFromJsonAsync<ApiResponse<PagedResult<PostListItemDto>>>();
        feedBody!.Data!.Items.Should().NotContain(p => p.Id == created.Data.Id);
    }

    [Fact]
    public async Task Moderator_ApprovePendingPost_PublishesToFeed()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var approveResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/posts/{CustomWebApplicationFactory.PendingPostId}",
            new ModeratePostRequest { Action = "approve", Note = "Approved for integration test." });

        approveResponse.EnsureSuccessStatusCode();
        var approved = await approveResponse.Content.ReadFromJsonAsync<ApiResponse<ModerationPostDetailDto>>();
        approved!.Data!.Status.Should().Be(nameof(PostStatus.Published));

        _client.DefaultRequestHeaders.Authorization = null;
        var publicFeed = await _client.GetAsync("/api/v1/posts?search=Pending+Post+For+Moderation");
        var feedBody = await publicFeed.Content.ReadFromJsonAsync<ApiResponse<PagedResult<PostListItemDto>>>();
        feedBody!.Data!.Items.Should().Contain(p => p.Id == CustomWebApplicationFactory.PendingPostId);
    }

    [Fact]
    public async Task Moderator_GetStatsAndQueue_ReturnsPendingCounts()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var statsResponse = await _client.GetAsync("/api/v1/admin/moderation/stats");
        statsResponse.EnsureSuccessStatusCode();
        var stats = await statsResponse.Content.ReadFromJsonAsync<ApiResponse<ModerationStatsDto>>();
        stats!.Data!.PendingPosts.Should().BeGreaterThan(0);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/posts?status=Pending&page=1&pageSize=20");
        queueResponse.EnsureSuccessStatusCode();
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ModerationPostListItemDto>>>();
        queue!.Data!.Items.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Moderator_RejectPendingPost_RequiresNote()
    {
        var studentToken = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = "Reject Me",
            Content = "Content to reject in moderation test.",
            Tags = ["reject-test"]
        });
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var rejectWithoutNote = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/posts/{created!.Data!.Id}",
            new ModeratePostRequest { Action = "reject" });
        rejectWithoutNote.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var rejectResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/posts/{created.Data.Id}",
            new ModeratePostRequest
            {
                Action = "reject",
                Note = "Violates community guidelines."
            });
        rejectResponse.EnsureSuccessStatusCode();
        var rejected = await rejectResponse.Content.ReadFromJsonAsync<ApiResponse<ModerationPostDetailDto>>();
        rejected!.Data!.Status.Should().Be(nameof(PostStatus.Rejected));
    }
}
