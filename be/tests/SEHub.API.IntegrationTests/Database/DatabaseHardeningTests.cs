using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Database;

public sealed class DatabaseHardeningTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DatabaseHardeningTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task New_hardening_tables_accept_seed_rows()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var tag = new Tag
        {
            Id = Guid.NewGuid(),
            Name = "hardening",
            Slug = "hardening",
            CreatedAt = DateTime.UtcNow
        };
        context.Tags.Add(tag);

        var post = await context.Posts.FirstAsync();
        context.PostTags.Add(new PostTag { PostId = post.Id, TagId = tag.Id });

        var question = await context.Questions.FirstOrDefaultAsync();
        if (question is not null)
        {
            context.QuestionAttachments.Add(new QuestionAttachment
            {
                Id = Guid.NewGuid(),
                QuestionId = question.Id,
                PublicId = "exam/test",
                Url = "https://cdn.example/exam/test.jpg",
                SortOrder = 0,
                CreatedAt = DateTime.UtcNow
            });
        }

        context.UserMissionProgress.Add(new UserMissionProgress
        {
            UserId = CustomWebApplicationFactory.FreeUserId,
            MissionCode = "daily-login",
            PeriodKey = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            ProgressCount = 1,
            UpdatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        Assert.True(await context.Tags.AnyAsync(t => t.Slug == "hardening"));
        Assert.True(await context.PostTags.AnyAsync(pt => pt.TagId == tag.Id));
        Assert.True(await context.UserMissionProgress.AnyAsync(p => p.MissionCode == "daily-login"));
    }
}
