using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Feed;

public sealed class PostTagFilterIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PostTagFilterIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetPosts_WithTagFilter_Matches_PostTags_When_LegacyTags_Empty()
    {
        var postId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01");
        var tagId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01");

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
            if (!await context.Posts.AnyAsync(p => p.Id == postId))
            {
                context.Posts.Add(new Post
                {
                    Id = postId,
                    AuthorId = CustomWebApplicationFactory.FreeUserId,
                    Title = "PostTags Only Filter Test",
                    Content = "Tagged via junction table only.",
                    Status = PostStatus.Published,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (!await context.Tags.AnyAsync(t => t.Id == tagId))
            {
                context.Tags.Add(new Tag
                {
                    Id = tagId,
                    Name = "javaonly",
                    Slug = "javaonly",
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (!await context.PostTags.AnyAsync(pt => pt.PostId == postId && pt.TagId == tagId))
            {
                context.PostTags.Add(new PostTag { PostId = postId, TagId = tagId });
            }

            await context.SaveChangesAsync();
        }

        var response = await _client.GetAsync("/api/v1/posts?tag=javaonly&page=1&pageSize=20");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<SEHub.Contracts.Common.ApiResponse<SEHub.Contracts.Common.PagedResult<PostListItemDto>>>();
        body!.Data!.Items.Should().Contain(p => p.Id == postId);
    }

    [Fact]
    public async Task GetPosts_WithTagFilter_DoesNot_Substring_Match_Javascript()
    {
        var postId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02");
        var tagId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02");

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
            if (!await context.Posts.AnyAsync(p => p.Id == postId))
            {
                context.Posts.Add(new Post
                {
                    Id = postId,
                    AuthorId = CustomWebApplicationFactory.FreeUserId,
                    Title = "Javascript Tag Post",
                    Content = "Should not match java filter.",
                    Status = PostStatus.Published,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (!await context.Tags.AnyAsync(t => t.Id == tagId))
            {
                context.Tags.Add(new Tag
                {
                    Id = tagId,
                    Name = "javascript",
                    Slug = "javascript",
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (!await context.PostTags.AnyAsync(pt => pt.PostId == postId && pt.TagId == tagId))
            {
                context.PostTags.Add(new PostTag { PostId = postId, TagId = tagId });
            }

            await context.SaveChangesAsync();
        }

        var response = await _client.GetAsync("/api/v1/posts?tag=java&page=1&pageSize=50");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<SEHub.Contracts.Common.ApiResponse<SEHub.Contracts.Common.PagedResult<PostListItemDto>>>();
        body!.Data!.Items.Should().NotContain(p => p.Id == postId);
    }
}
