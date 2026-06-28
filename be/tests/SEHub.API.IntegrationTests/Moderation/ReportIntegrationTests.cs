using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Contracts.Users;

namespace SEHub.API.IntegrationTests.Moderation;

public sealed class ReportIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ReportIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ReportComment_Submitted_AppearsInModeratorCommunityReports()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var reportResponse = await _client.PostAsJsonAsync(
            $"/api/v1/posts/{CustomWebApplicationFactory.ReportSeedPostId}/comments/{CustomWebApplicationFactory.ReportSeedCommentId}/report",
            new ReportCommentRequest
            {
                Reason = "harassment",
                Detail = "Comment contains harassing language in integration test."
            });
        reportResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/reports?status=Pending&page=1&pageSize=20");
        queueResponse.EnsureSuccessStatusCode();
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ReportDto>>>();
        queue!.Data!.Items.Should().Contain(r =>
            r.CommentId == CustomWebApplicationFactory.ReportSeedCommentId
            && r.Kind == "comment");

        var statsResponse = await _client.GetAsync("/api/v1/admin/moderation/stats");
        statsResponse.EnsureSuccessStatusCode();
        var stats = await statsResponse.Content.ReadFromJsonAsync<ApiResponse<ModerationStatsDto>>();
        stats!.Data!.PendingReports.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task ReportUser_Submitted_AppearsInModeratorUserReports()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var reportResponse = await _client.PostAsJsonAsync(
            $"/api/v1/users/{CustomWebApplicationFactory.ModeratorUserId}/report",
            new ReportUserRequest
            {
                Source = "profile",
                Reason = "harassment",
                Detail = "User sent harassing messages during integration test."
            });
        reportResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/user-reports?status=Pending&page=1&pageSize=20");
        queueResponse.EnsureSuccessStatusCode();
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<UserReportDto>>>();
        queue!.Data!.Items.Should().Contain(r => r.ReportedUserId == CustomWebApplicationFactory.ModeratorUserId);

        var countResponse = await _client.GetAsync("/api/v1/admin/moderation/user-reports/pending-count");
        countResponse.EnsureSuccessStatusCode();
        await using var countStream = await countResponse.Content.ReadAsStreamAsync();
        using var countDoc = await System.Text.Json.JsonDocument.ParseAsync(countStream);
        var pendingCount = countDoc.RootElement.TryGetProperty("count", out var countElement)
            ? countElement.GetInt32()
            : countDoc.RootElement.GetProperty("data").GetProperty("count").GetInt32();
        pendingCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task EscalateUserReport_AddsUserToViolationsQueue()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        await _client.PostAsJsonAsync(
            $"/api/v1/users/{CustomWebApplicationFactory.ModeratorUserId}/report",
            new ReportUserRequest
            {
                Source = "chat",
                Reason = "spam",
                Detail = "Repeated spam messages in chat during integration test."
            });

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/user-reports?status=Pending&page=1&pageSize=20");
        queueResponse.EnsureSuccessStatusCode();
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<UserReportDto>>>();
        var report = queue!.Data!.Items.First(r => r.ReportedUserId == CustomWebApplicationFactory.ModeratorUserId);

        var escalateResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/reports/{report.Id}/escalate-violations",
            new EscalateUserReportRequest { Source = "account" });
        escalateResponse.EnsureSuccessStatusCode();

        var violationsResponse = await _client.GetAsync(
            "/api/v1/admin/moderation/violations?status=all&page=1&pageSize=20");
        violationsResponse.EnsureSuccessStatusCode();
        var violations = await violationsResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ViolatingUserDto>>>();
        violations!.Data!.Items.Should().Contain(u => u.Id == CustomWebApplicationFactory.ModeratorUserId);
    }
}
