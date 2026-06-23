using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Common;
using SEHub.Contracts.Messaging;
using SEHub.Contracts.Notifications;
using SEHub.Contracts.Users;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Social;

public sealed class SocialPhase3EndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    public static readonly Guid TargetUserId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    public const string TargetUsername = "phase3target";
    public const string TargetPassword = "Target@Phase3";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SocialPhase3EndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Follow_CreatesNotificationForTarget()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);

        using (var followRequest = CreateAuthorizedPost(token, $"/api/v1/users/{TargetUserId}/follow"))
        {
            var followResponse = await _client.SendAsync(followRequest);
            followResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        var targetToken = await LoginTargetUserAsync();

        using var notificationsRequest = CreateAuthorizedGet(targetToken, "/api/v1/notifications?page=1&pageSize=10");
        var notificationsResponse = await _client.SendAsync(notificationsRequest);
        notificationsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await notificationsResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<NotificationDto>>>();
        body!.Data!.Items.Should().ContainSingle(item =>
            item.Type == "follow" && item.ActorUserId == CustomWebApplicationFactory.FreeUserId);
    }

    [Fact]
    public async Task BlockUser_PreventsCreatingConversation()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);

        using (var blockRequest = CreateAuthorizedPost(token, $"/api/v1/users/{TargetUserId}/block"))
        {
            var blockResponse = await _client.SendAsync(blockRequest);
            blockResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var blockBody = await blockResponse.Content.ReadFromJsonAsync<ApiResponse<BlockActionResultDto>>();
            blockBody!.Data!.IsBlockedByMe.Should().BeTrue();
        }

        using var conversationRequest = CreateAuthorizedPost(token, $"/api/v1/conversations/with/{TargetUserId}");
        var conversationResponse = await _client.SendAsync(conversationRequest);
        conversationResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ReportConversation_CreatesPendingReport()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);

        using (var unblockRequest = CreateAuthorizedDelete(token, $"/api/v1/users/{TargetUserId}/block"))
        {
            await _client.SendAsync(unblockRequest);
        }

        Guid conversationId;

        using (var createRequest = CreateAuthorizedPost(token, $"/api/v1/conversations/with/{TargetUserId}"))
        {
            var createResponse = await _client.SendAsync(createRequest);
            createResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var createBody = await createResponse.Content.ReadFromJsonAsync<ApiResponse<ConversationListItemDto>>();
            conversationId = createBody!.Data!.ConversationId;
        }

        using (var reportRequest = CreateAuthorizedJsonPost(
            token,
            $"/api/v1/conversations/{conversationId}/report",
            new ReportConversationRequest
            {
                Reason = "Spam hoặc quảng cáo",
                Detail = "Người dùng gửi quảng cáo khóa học liên tục trong chat."
            }))
        {
            var reportResponse = await _client.SendAsync(reportRequest);
            reportResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var report = await context.ConversationReports.FirstOrDefaultAsync(r =>
            r.ConversationId == conversationId && r.ReporterId == CustomWebApplicationFactory.FreeUserId);

        report.Should().NotBeNull();
        report!.Status.Should().Be(Domain.Enums.ReportStatus.Pending);
    }

    [Fact]
    public async Task Notifications_MarkReadAndMarkAllRead_Work()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);

        using (var followRequest = CreateAuthorizedPost(token, $"/api/v1/users/{TargetUserId}/follow"))
        {
            await _client.SendAsync(followRequest);
        }

        var targetToken = await LoginTargetUserAsync();
        Guid notificationId;

        using (var listRequest = CreateAuthorizedGet(targetToken, "/api/v1/notifications?page=1&pageSize=5"))
        {
            var listResponse = await _client.SendAsync(listRequest);
            var listBody = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<NotificationDto>>>();
            notificationId = listBody!.Data!.Items.First().Id;
        }

        using (var readRequest = CreateAuthorizedPost(targetToken, $"/api/v1/notifications/{notificationId}/read"))
        {
            var readResponse = await _client.SendAsync(readRequest);
            readResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        using (var unreadRequest = CreateAuthorizedGet(targetToken, "/api/v1/notifications/unread-count"))
        {
            var unreadResponse = await _client.SendAsync(unreadRequest);
            var unreadBody = await unreadResponse.Content.ReadFromJsonAsync<ApiResponse<UnreadNotificationCountDto>>();
            unreadBody!.Data!.TotalUnread.Should().Be(0);
        }
    }

    private async Task SeedTargetUserAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        if (await userManager.FindByIdAsync(TargetUserId.ToString()) is not null)
        {
            return;
        }

        var bronzeLevel = await context.LevelConfigs.OrderBy(l => l.MinPoints).FirstAsync();

        var user = new ApplicationUser
        {
            Id = TargetUserId,
            UserName = TargetUsername,
            Email = "phase3target@test.local",
            EmailConfirmed = true,
            DisplayName = "Phase 3 Target",
            LevelId = bronzeLevel.Id
        };

        await userManager.CreateAsync(user, TargetPassword);
        await userManager.AddToRoleAsync(user, RoleNames.Student);

        context.UserProfiles.Add(new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = TargetUserId,
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
    }

    private async Task<string> LoginTargetUserAsync()
    {
        var payload = JsonSerializer.Serialize(new
        {
            emailOrUsername = "phase3target@test.local",
            password = TargetPassword
        });

        using var response = await _client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);
        return document.RootElement.GetProperty("data").GetProperty("accessToken").GetString()!;
    }

    private static HttpRequestMessage CreateAuthorizedGet(string token, string path)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private static HttpRequestMessage CreateAuthorizedPost(string token, string path)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = new StringContent("{}", Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private static HttpRequestMessage CreateAuthorizedDelete(string token, string path)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private static HttpRequestMessage CreateAuthorizedJsonPost<T>(string token, string path, T body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }
}
