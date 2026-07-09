using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Contracts.Notifications;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Exams;

public sealed class PracticeReviewNotificationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly Guid AdminReviewSubmissionId = Guid.Parse("44444444-4444-4444-4444-444444444445");

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PracticeReviewNotificationIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Moderator_ReviewPracticeSubmission_NotifiesAdmins()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var reviewResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PracticeExamId}/practice-submissions/{CustomWebApplicationFactory.PracticeSubmissionId}",
            new ReviewPracticeRequest
            {
                Status = nameof(PracticeSubmissionStatus.Passed),
                ReviewerComment = "PRACTICE_REVIEWED_BY_MOD:8.5|Good work",
            });
        reviewResponse.EnsureSuccessStatusCode();

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var notificationsResponse = await _client.GetAsync("/api/v1/notifications?page=1&pageSize=20");
        notificationsResponse.EnsureSuccessStatusCode();

        var notificationsBody =
            await notificationsResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<NotificationDto>>>();

        notificationsBody!.Data!.Items.Should().Contain(item =>
            item.Type == "moderation"
            && item.Title.Contains("đã chấm bài thực hành", StringComparison.OrdinalIgnoreCase)
            && item.LinkUrl != null
            && item.LinkUrl.Contains($"/admin/moderation/practice-submissions?highlight={CustomWebApplicationFactory.PracticeSubmissionId}", StringComparison.Ordinal)
            && item.ReferenceId == CustomWebApplicationFactory.PracticeSubmissionId);
    }

    [Fact]
    public async Task Admin_ReviewPracticeSubmission_WritesActivityLog_WithoutAdminGradingNotification()
    {
        await SeedAdminReviewSubmissionAsync();

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var notificationsBeforeResponse = await _client.GetAsync("/api/v1/notifications?page=1&pageSize=50");
        notificationsBeforeResponse.EnsureSuccessStatusCode();
        var notificationsBefore =
            await notificationsBeforeResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<NotificationDto>>>();
        var gradingNotificationsBefore = notificationsBefore!.Data!.Items.Count(item =>
            item.Type == "moderation"
            && item.Title.Contains("đã chấm bài thực hành", StringComparison.OrdinalIgnoreCase)
            && item.ReferenceId == AdminReviewSubmissionId);

        var reviewResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PracticeExamId}/practice-submissions/{AdminReviewSubmissionId}",
            new ReviewPracticeRequest
            {
                Status = nameof(PracticeSubmissionStatus.Reviewed),
                ReviewerComment = "PRACTICE_REVIEWED_BY_ADMIN: reviewed",
            });
        reviewResponse.EnsureSuccessStatusCode();

        var notificationsAfterResponse = await _client.GetAsync("/api/v1/notifications?page=1&pageSize=50");
        notificationsAfterResponse.EnsureSuccessStatusCode();
        var notificationsAfter =
            await notificationsAfterResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<NotificationDto>>>();
        var gradingNotificationsAfter = notificationsAfter!.Data!.Items.Count(item =>
            item.Type == "moderation"
            && item.Title.Contains("đã chấm bài thực hành", StringComparison.OrdinalIgnoreCase)
            && item.ReferenceId == AdminReviewSubmissionId);

        gradingNotificationsAfter.Should().Be(gradingNotificationsBefore);

        var auditResponse = await _client.GetAsync("/api/v1/admin/audit-logs?page=1&pageSize=50");
        auditResponse.EnsureSuccessStatusCode();
        var auditBody = await auditResponse.Content.ReadFromJsonAsync<ApiResponse<AdminActivityLogPageDto>>();
        auditBody!.Data!.Items.Should().Contain(item =>
            item.Action == "PRACTICE_REVIEWED"
            && item.Text.Contains("PRACTICE_REVIEWED", StringComparison.Ordinal)
            && item.Text.Contains("admin", StringComparison.OrdinalIgnoreCase));
    }

    private async Task SeedAdminReviewSubmissionAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        if (await context.PracticeSubmissions.AnyAsync(s => s.Id == AdminReviewSubmissionId))
        {
            return;
        }

        context.PracticeSubmissions.Add(new PracticeSubmission
        {
            Id = AdminReviewSubmissionId,
            UserId = CustomWebApplicationFactory.FreeUserId,
            ExamId = CustomWebApplicationFactory.PracticeExamId,
            GitHubRepoUrl = "https://github.com/sehub-test/admin-review-lab",
            SubmittedAt = DateTime.UtcNow.AddHours(-1),
            Status = PracticeSubmissionStatus.Submitted,
            IsLatest = true,
            CreatedAt = DateTime.UtcNow.AddHours(-1),
        });

        await context.SaveChangesAsync();
    }
}
