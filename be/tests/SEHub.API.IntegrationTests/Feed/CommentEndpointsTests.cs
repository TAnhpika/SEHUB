using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Feed;

public sealed class CommentEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public CommentEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Reply_Update_Delete_NestedComments_WorkEndToEnd()
    {
        var postId = await SeedPublishedPostAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var rootResponse = await _client.PostAsJsonAsync(
            $"/api/v1/posts/{postId}/comments",
            new CreateCommentRequest { Content = "Root comment for thread" });
        rootResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var rootBody = await rootResponse.Content.ReadFromJsonAsync<ApiResponse<CommentDto>>();
        var rootId = rootBody!.Data!.Id;

        var replyResponse = await _client.PostAsJsonAsync(
            $"/api/v1/posts/{postId}/comments",
            new CreateCommentRequest { Content = "Nested reply body", ParentCommentId = rootId });
        replyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var replyBody = await replyResponse.Content.ReadFromJsonAsync<ApiResponse<CommentDto>>();
        replyBody!.Data!.ParentCommentId.Should().Be(rootId);
        var replyId = replyBody.Data.Id;

        var listResponse = await _client.GetAsync($"/api/v1/posts/{postId}/comments?page=1&pageSize=20");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var listBody = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<CommentDto>>>();
        var rootItem = listBody!.Data!.Items.Should().ContainSingle(c => c.Id == rootId).Subject;
        rootItem.Replies.Should().ContainSingle(r => r.Id == replyId);

        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/v1/posts/{postId}/comments/{replyId}",
            new UpdateCommentRequest { Content = "Edited nested reply" });
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var updateBody = await updateResponse.Content.ReadFromJsonAsync<ApiResponse<CommentDto>>();
        updateBody!.Data!.Content.Should().Be("Edited nested reply");

        var deleteResponse = await _client.DeleteAsync($"/api/v1/posts/{postId}/comments/{rootId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var deleted = await context.Comments.IgnoreQueryFilters()
            .Where(c => c.Id == rootId || c.Id == replyId)
            .ToListAsync();
        deleted.Should().HaveCount(2);
        deleted.Should().OnlyContain(c => c.IsDeleted);
    }

    private async Task<Guid> SeedPublishedPostAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var postId = Guid.NewGuid();
        context.Posts.Add(new Post
        {
            Id = postId,
            AuthorId = CustomWebApplicationFactory.FreeUserId,
            Title = $"Comment thread {postId:N}"[..40],
            Content = "Body for comment thread tests",
            Status = PostStatus.Published,
            CreatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();
        return postId;
    }
}
