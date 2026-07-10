using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Contracts.Feed;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Notifications;

public sealed class WorkflowNotificationRoutingIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public WorkflowNotificationRoutingIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreatePost_Pending_NotifiesModeratorsOnly()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = $"Notify Routing Post {Guid.NewGuid():N}"[..32],
            Content = "Post pending notification routing integration test.",
            Tags = ["notify-routing"],
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        var postId = created!.Data!.Id;

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var notifications = await context.UserNotifications
            .AsNoTracking()
            .Where(n => n.ReferenceId == postId)
            .ToListAsync();

        var recipientIds = notifications
            .Where(n => n.Title.Contains("đăng bài chờ duyệt", StringComparison.Ordinal))
            .Select(n => n.UserId)
            .ToList();

        recipientIds.Should().Contain(CustomWebApplicationFactory.ModeratorUserId);
        recipientIds.Should().NotContain(CustomWebApplicationFactory.AdminUserId);
    }

    [Fact]
    public async Task Moderator_SubmitExamPending_NotifiesAdminsOnly()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var paperCode = $"INT-NOTIFY-{Guid.NewGuid():N}"[..24];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "PRF192",
            PaperCode = paperCode,
            ExamType = nameof(ExamType.Practice),
            Description = "Notification routing integration test.",
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var examId = created!.Data!.Id;

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var notifications = await context.UserNotifications
            .AsNoTracking()
            .Where(n => n.ReferenceId == examId)
            .ToListAsync();

        var recipientIds = notifications
            .Where(n => n.Title.Contains("gửi đề chờ duyệt", StringComparison.Ordinal))
            .Select(n => n.UserId)
            .ToList();

        recipientIds.Should().Contain(CustomWebApplicationFactory.AdminUserId);
        recipientIds.Should().NotContain(CustomWebApplicationFactory.ModeratorUserId);
    }
}
