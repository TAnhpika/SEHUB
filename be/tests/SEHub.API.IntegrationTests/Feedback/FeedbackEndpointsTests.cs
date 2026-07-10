using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feedback;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Feedback;

public sealed class FeedbackEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private const string FeedbackEndpoint = "/api/v1/feedback";
    private const string AdminFeedbackEndpoint = "/api/v1/admin/feedback";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public FeedbackEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task SubmitFeedback_WithoutToken_ReturnsUnauthorized()
    {
        using var content = CreateSubmitContent("free_user", "Broken exam list");

        var response = await _client.PostAsync(FeedbackEndpoint, content);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SubmitFeedback_WithToken_PersistsPendingFeedback()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        using var request = CreateAuthorizedSubmitRequest(
            token,
            "free_user",
            "Final exam page shows empty catalog");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FeedbackDto>>();
        body!.Success.Should().BeTrue();
        body.Data!.Username.Should().Be("free_user");
        body.Data.Description.Should().Be("Final exam page shows empty catalog");
        body.Data.Status.Should().Be(nameof(FeedbackStatus.Pending));

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var stored = await context.UserFeedbacks.SingleAsync(f => f.Id == body.Data.Id);

        stored.UserId.Should().Be(CustomWebApplicationFactory.FreeUserId);
        stored.Status.Should().Be(FeedbackStatus.Pending);
        stored.AttachmentUrlsJson.Should().Be("[]");
    }

    [Fact]
    public async Task Admin_ListFeedback_ReturnsSubmittedItems()
    {
        var userToken = await _factory.LoginAndGetTokenAsync(_client);
        using (var submitRequest = CreateAuthorizedSubmitRequest(
            userToken,
            "freeuser",
            "Admin list integration feedback"))
        {
            var submitResponse = await _client.SendAsync(submitRequest);
            submitResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{AdminFeedbackEndpoint}?status=Pending&pageSize=20");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<FeedbackDto>>>();
        body!.Success.Should().BeTrue();
        body.Data!.Items.Should().Contain(f => f.Description == "Admin list integration feedback");
    }

    [Fact]
    public async Task Admin_UpdateFeedbackStatus_ChangesStatus()
    {
        var feedbackId = await SeedFeedbackAsync();

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        using var request = new HttpRequestMessage(HttpMethod.Patch, $"{AdminFeedbackEndpoint}/{feedbackId}")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(new { status = nameof(FeedbackStatus.Reviewed) }),
                Encoding.UTF8,
                "application/json"),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResponse<FeedbackDto>>();
        body!.Data!.Status.Should().Be(nameof(FeedbackStatus.Reviewed));

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var stored = await context.UserFeedbacks.SingleAsync(f => f.Id == feedbackId);
        stored.Status.Should().Be(FeedbackStatus.Reviewed);
        stored.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Admin_ListFeedback_WithoutAdminToken_ReturnsForbidden()
    {
        var userToken = await _factory.LoginAndGetTokenAsync(_client);
        using var request = new HttpRequestMessage(HttpMethod.Get, AdminFeedbackEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userToken);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private static StringContent CreateSubmitContent(string username, string description, IReadOnlyList<string>? attachmentUrls = null)
    {
        var payload = JsonSerializer.Serialize(new
        {
            username,
            description,
            attachmentUrls = attachmentUrls ?? Array.Empty<string>(),
        });

        return new StringContent(payload, Encoding.UTF8, "application/json");
    }

    private static HttpRequestMessage CreateAuthorizedSubmitRequest(
        string token,
        string username,
        string description,
        IReadOnlyList<string>? attachmentUrls = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, FeedbackEndpoint)
        {
            Content = CreateSubmitContent(username, description, attachmentUrls),
        };
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {token}");
        return request;
    }

    private async Task<Guid> SeedFeedbackAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var existing = await context.UserFeedbacks
            .FirstOrDefaultAsync(f => f.Username == "seed_feedback_user");

        if (existing is not null)
        {
            return existing.Id;
        }

        var feedback = new Domain.Entities.UserFeedback
        {
            Id = Guid.NewGuid(),
            UserId = CustomWebApplicationFactory.FreeUserId,
            Username = "seed_feedback_user",
            Description = "Seed feedback for admin list test",
            Status = FeedbackStatus.Pending,
            AttachmentUrlsJson = "[]",
            CreatedAt = DateTime.UtcNow,
        };

        context.UserFeedbacks.Add(feedback);
        await context.SaveChangesAsync();
        return feedback.Id;
    }
}
