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
    public async Task CreatePost_Pending_NotifiesModeratorsAndAdmins()
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

        var pending = notifications
            .Where(n => n.Title.Contains("đăng bài chờ duyệt", StringComparison.Ordinal))
            .ToList();

        pending.Select(n => n.UserId).Should().Contain(CustomWebApplicationFactory.ModeratorUserId);
        pending.Select(n => n.UserId).Should().Contain(CustomWebApplicationFactory.AdminUserId);

        pending.Should().Contain(n =>
            n.UserId == CustomWebApplicationFactory.ModeratorUserId
            && n.LinkUrl == "/moderator/content");
        pending.Should().Contain(n =>
            n.UserId == CustomWebApplicationFactory.AdminUserId
            && n.LinkUrl == "/admin/moderation/content");
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

    [Fact]
    public async Task Admin_RejectModeratorExam_NotifiesModeratorWithEditLink()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var paperCode = $"INT-REJECT-{Guid.NewGuid():N}"[..24];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "PRF192",
            PaperCode = paperCode,
            ExamType = nameof(ExamType.Practice),
            Description = "Reject notification routing integration test.",
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var examId = created!.Data!.Id;

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var rejectResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/exams/{examId}/reject",
            new RejectExamRequest { ReasonCode = "content", Detail = "Needs revision." });
        rejectResponse.EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var notification = await context.UserNotifications
            .AsNoTracking()
            .Where(n => n.ReferenceId == examId && n.UserId == CustomWebApplicationFactory.ModeratorUserId)
            .OrderByDescending(n => n.CreatedAt)
            .FirstOrDefaultAsync();

        notification.Should().NotBeNull();
        notification!.LinkUrl.Should().Be($"/moderator/practice-exams/edit/{examId}");
    }
}
