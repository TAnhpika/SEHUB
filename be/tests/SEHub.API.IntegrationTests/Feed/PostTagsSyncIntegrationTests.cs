using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Feed;

public sealed class PostTagsSyncIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PostTagsSyncIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateAndUpdatePost_Syncs_PostTags_Junction()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = "PostTags Sync Smoke",
            Content = "Verify PostTags junction on create and update.",
            Tags = ["SmokeTagA", "SmokeTagB"]
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        var postId = created!.Data!.Id;
        created.Data.Tags.Should().BeEquivalentTo(["SmokeTagA", "SmokeTagB"]);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

            var linkedSlugs = await context.PostTags
                .AsNoTracking()
                .Where(pt => pt.PostId == postId)
                .Select(pt => pt.Tag.Slug)
                .OrderBy(s => s)
                .ToListAsync();

            linkedSlugs.Should().BeEquivalentTo(["smoketaga", "smoketagb"]);
        }

        var updateResponse = await _client.PutAsJsonAsync($"/api/v1/posts/{postId}", new UpdatePostRequest
        {
            Title = "PostTags Sync Smoke Updated",
            Content = "Tags replaced on update.",
            Tags = ["SmokeTagB", "SmokeTagC"]
        });

        updateResponse.EnsureSuccessStatusCode();
        var updated = await updateResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        updated!.Data!.Tags.Should().BeEquivalentTo(["SmokeTagB", "SmokeTagC"]);

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

            var linkedSlugs = await context.PostTags
                .AsNoTracking()
                .Where(pt => pt.PostId == postId)
                .Select(pt => pt.Tag.Slug)
                .OrderBy(s => s)
                .ToListAsync();

            linkedSlugs.Should().BeEquivalentTo(["smoketagb", "smoketagc"]);
            linkedSlugs.Should().NotContain("smoketaga");
        }
    }
}
