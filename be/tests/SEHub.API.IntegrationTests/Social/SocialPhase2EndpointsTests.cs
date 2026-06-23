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
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Social;

public sealed class SocialPhase2EndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    public static readonly Guid TargetUserId = Guid.Parse("99999999-9999-9999-9999-999999999999");
    public const string TargetUsername = "friendtarget";
    public const string TargetPassword = "Target@Test123";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SocialPhase2EndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Messaging_CreateConversation_SendMessage_MarkRead()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        var targetToken = await LoginTargetUserAsync();

        Guid conversationId;
        using (var createRequest = CreateAuthorizedPost(token, $"/api/v1/conversations/with/{TargetUserId}"))
        {
            var createResponse = await _client.SendAsync(createRequest);
            createResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var createBody = await createResponse.Content.ReadFromJsonAsync<ApiResponse<ConversationListItemDto>>();
            conversationId = createBody!.Data!.ConversationId;
        }

        using (var sendRequest = CreateAuthorizedJsonPost(
            token,
            $"/api/v1/conversations/{conversationId}/messages",
            new SendMessageRequest { Content = "Hello from integration test" }))
        {
            var sendResponse = await _client.SendAsync(sendRequest);
            sendResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var sendBody = await sendResponse.Content.ReadFromJsonAsync<ApiResponse<MessageDto>>();
            sendBody!.Data!.Content.Should().Be("Hello from integration test");
            sendBody.Data.IsMine.Should().BeTrue();
        }

        using (var messagesRequest = CreateAuthorizedGet(targetToken, $"/api/v1/conversations/{conversationId}/messages"))
        {
            var messagesResponse = await _client.SendAsync(messagesRequest);
            var messagesBody = await messagesResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<MessageDto>>>();
            messagesBody!.Data!.Items.Should().ContainSingle(m => m.Content == "Hello from integration test");
        }

        using (var unreadRequest = CreateAuthorizedGet(targetToken, "/api/v1/conversations/unread-count"))
        {
            var unreadResponse = await _client.SendAsync(unreadRequest);
            var unreadBody = await unreadResponse.Content.ReadFromJsonAsync<ApiResponse<UnreadCountDto>>();
            unreadBody!.Data!.TotalUnread.Should().BeGreaterThan(0);
        }

        using (var readRequest = CreateAuthorizedPost(targetToken, $"/api/v1/conversations/{conversationId}/read"))
        {
            var readResponse = await _client.SendAsync(readRequest);
            readResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        using (var unreadAfterRequest = CreateAuthorizedGet(targetToken, "/api/v1/conversations/unread-count"))
        {
            var unreadResponse = await _client.SendAsync(unreadAfterRequest);
            var unreadBody = await unreadResponse.Content.ReadFromJsonAsync<ApiResponse<UnreadCountDto>>();
            unreadBody!.Data!.TotalUnread.Should().Be(0);
        }
    }

    private async Task SeedTargetUserAsync()
    {
        using var scope = _factory.Services.CreateScope();
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
            Email = "friendtarget@test.local",
            EmailConfirmed = true,
            DisplayName = "Friend Target",
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
            emailOrUsername = "friendtarget@test.local",
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

    private static HttpRequestMessage CreateAuthorizedGet(string token, string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private static HttpRequestMessage CreateAuthorizedPost(string token, string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(string.Empty, Encoding.UTF8, "application/json");
        return request;
    }

    private static HttpRequestMessage CreateAuthorizedDelete(string token, string url)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return request;
    }

    private static HttpRequestMessage CreateAuthorizedJsonPost<T>(string token, string url, T body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(body);
        return request;
    }
}
