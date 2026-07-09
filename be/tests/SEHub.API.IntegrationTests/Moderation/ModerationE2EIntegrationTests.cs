using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.API.IntegrationTests.Social;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Contracts.Feed;
using SEHub.Contracts.Users;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Identity;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Moderation;

/// <summary>
/// E2E API coverage for the moderation & account-lock test plan (R1–R5, mod resolve, L1–L12).
/// </summary>
public sealed class ModerationE2EIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly Guid QuestionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ModerationE2EIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // --- R1: Post report → moderator queue ---

    [Fact]
    public async Task ReportPost_AppearsInModeratorCommunityQueue()
    {
        var postId = await CreateApprovedPostAsync("Report Queue E2E Post");

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var reportResponse = await _client.PostAsJsonAsync(
            $"/api/v1/posts/{postId}/report",
            new ReportPostRequest { Reason = "Spam content in E2E test post for queue verification." });
        reportResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/reports?status=Pending&page=1&pageSize=50");
        queueResponse.EnsureSuccessStatusCode();
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ReportDto>>>();
        queue!.Data!.Items.Should().Contain(r =>
            r.PostId == postId && r.Kind == "post");
    }

    // --- R3: User profile report ---

    [Fact]
    public async Task ReportUser_Profile_AppearsInUserReportsQueue()
    {
        await SeedTargetUserAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var reportResponse = await _client.PostAsJsonAsync(
            $"/api/v1/users/{SocialPhase3EndpointsTests.TargetUserId}/report",
            new ReportUserRequest
            {
                Source = "profile",
                Reason = "harassment",
                Detail = "User harassed others in profile context during E2E test."
            });
        reportResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/user-reports?status=Pending&page=1&pageSize=50");
        queueResponse.EnsureSuccessStatusCode();
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<UserReportDto>>>();
        queue!.Data!.Items.Should().Contain(r => r.ReportedUserId == SocialPhase3EndpointsTests.TargetUserId);
    }

    // --- R5: Exam question report ---

    [Fact]
    public async Task ReportQuestion_AppearsInQuestionReportsQueue()
    {
        await SeedExamQuestionAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var reportResponse = await _client.PostAsJsonAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PublishedExamId}/questions/{QuestionId}/report",
            new CreateQuestionReportRequest
            {
                Reason = "wrong_answer",
                Detail = "The marked correct answer does not match the question stem."
            });
        reportResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/question-reports?status=Pending&page=1&pageSize=50");
        queueResponse.EnsureSuccessStatusCode();
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<QuestionReportDto>>>();
        queue!.Data!.Items.Should().Contain(r => r.QuestionId == QuestionId);
    }

    // --- Negative: self-report & duplicate ---

    [Fact]
    public async Task ReportSelf_ReturnsForbidden()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/users/{CustomWebApplicationFactory.FreeUserId}/report",
            new ReportUserRequest
            {
                Source = "profile",
                Reason = "spam",
                Detail = "Attempting to report own account should be rejected."
            });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ReportPost_Duplicate_ReturnsConflict()
    {
        var postId = await CreateApprovedPostAsync("Duplicate Report E2E Post");

        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var body = new ReportPostRequest { Reason = "Duplicate post report E2E test reason." };
        var first = await _client.PostAsJsonAsync($"/api/v1/posts/{postId}/report", body);
        first.StatusCode.Should().Be(HttpStatusCode.OK);

        var duplicate = await _client.PostAsJsonAsync($"/api/v1/posts/{postId}/report", body);
        duplicate.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    // --- Mod: dismiss community report ---

    [Fact]
    public async Task Moderator_DismissCommunityReport_ResolvesReport()
    {
        var studentToken = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        await _client.PostAsJsonAsync(
            $"/api/v1/posts/{CustomWebApplicationFactory.ReportSeedPostId}/report",
            new ReportPostRequest { Reason = "Dismiss flow E2E test report reason." });

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/reports?status=Pending&page=1&pageSize=50");
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ReportDto>>>();
        var report = queue!.Data!.Items.First(r =>
            r.PostId == CustomWebApplicationFactory.ReportSeedPostId && r.Kind == "post");

        var resolveResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/reports/{report.Id}",
            new ResolveReportRequest { Status = "Resolved", Action = "ignored" });
        resolveResponse.EnsureSuccessStatusCode();
        var resolved = await resolveResponse.Content.ReadFromJsonAsync<ApiResponse<ReportDto>>();
        resolved!.Data!.Status.Should().Be("Resolved");
    }

    // --- Mod: delete post from report ---

    [Fact]
    public async Task Moderator_DeletePostFromReport_SoftDeletesPost()
    {
        var studentToken = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = "Post To Delete Via Report",
            Content = "Content for delete-via-report E2E test.",
            Tags = ["e2e-delete"]
        });
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var postId = (await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>())!.Data!.Id;

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);
        await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/posts/{postId}",
            new ModeratePostRequest { Action = "approve", Note = "Approve for report delete test." });

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        await _client.PostAsJsonAsync(
            $"/api/v1/posts/{postId}/report",
            new ReportPostRequest { Reason = "Delete via report E2E test reason." });

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);
        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/reports?status=Pending&page=1&pageSize=50");
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ReportDto>>>();
        var report = queue!.Data!.Items.First(r => r.PostId == postId);

        var resolveResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/reports/{report.Id}",
            new ResolveReportRequest { Status = "Resolved", Action = "delete_post" });
        resolveResponse.EnsureSuccessStatusCode();

        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var post = await context.Posts.IgnoreQueryFilters().FirstAsync(p => p.Id == postId);
        post.IsDeleted.Should().BeTrue();
    }

    // --- Mod: dismiss user report ---

    [Fact]
    public async Task Moderator_DismissUserReport_ResolvesReport()
    {
        await SeedTargetUserAsync();

        var studentToken = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        await _client.PostAsJsonAsync(
            $"/api/v1/users/{SocialPhase3EndpointsTests.TargetUserId}/report",
            new ReportUserRequest
            {
                Source = "profile",
                Reason = "spam",
                Detail = "Dismiss user report E2E test with sufficient detail."
            });

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/user-reports?status=Pending&page=1&pageSize=50");
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<UserReportDto>>>();
        var report = queue!.Data!.Items.First(r => r.ReportedUserId == SocialPhase3EndpointsTests.TargetUserId);

        var resolveResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/user-reports/{report.Id}",
            new ResolveUserReportRequest { Status = "Resolved", ResolutionNote = "ignored" });
        resolveResponse.EnsureSuccessStatusCode();
        var resolved = await resolveResponse.Content.ReadFromJsonAsync<ApiResponse<UserReportDto>>();
        resolved!.Data!.Status.Should().Be("Resolved");
    }

    // --- L2-L3: Ban 7 days blocks login ---

    [Fact]
    public async Task Moderator_Ban7Days_BlocksLogin()
    {
        await SeedTargetUserAsync();
        var targetId = SocialPhase3EndpointsTests.TargetUserId;

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var banResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetId}/ban",
            new ModeratorBanUserRequest { DurationDays = 7, Reason = "Seven day ban E2E integration test." });
        banResponse.EnsureSuccessStatusCode();
        var banned = await banResponse.Content.ReadFromJsonAsync<ApiResponse<ViolatingUserDto>>();
        banned!.Data!.Status.Should().Be("locked");

        _client.DefaultRequestHeaders.Authorization = null;
        var loginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { emailOrUsername = SocialPhase3EndpointsTests.TargetUsername, password = SocialPhase3EndpointsTests.TargetPassword });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // --- L4: BannedUserMiddleware blocks active session ---

    [Fact]
    public async Task BannedUserMiddleware_BlocksApiCallWithExistingToken()
    {
        await SeedTargetUserAsync();
        var targetId = SocialPhase3EndpointsTests.TargetUserId;

        var targetToken = await LoginTargetUserAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", targetToken);

        var profileBeforeBan = await _client.GetAsync("/api/v1/auth/me");
        profileBeforeBan.StatusCode.Should().Be(HttpStatusCode.OK);

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);
        await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetId}/ban",
            new ModeratorBanUserRequest { DurationDays = 1, Reason = "Middleware ban E2E test reason." });

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", targetToken);
        var profileAfterBan = await _client.GetAsync("/api/v1/auth/me");
        profileAfterBan.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        await using var bodyStream = await profileAfterBan.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(bodyStream);
        doc.RootElement.GetProperty("message").GetString().Should().Contain("khóa");
    }

    // --- L5: Unban restores access ---

    [Fact]
    public async Task Moderator_Unban_RestoresLogin()
    {
        await SeedTargetUserAsync();
        var targetId = SocialPhase3EndpointsTests.TargetUserId;

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetId}/ban",
            new ModeratorBanUserRequest { DurationDays = 1, Reason = "Unban flow E2E test reason." });

        await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetId}/unban",
            new UnbanUserRequest { Note = "E2E unban complete" });

        _client.DefaultRequestHeaders.Authorization = null;
        var loginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { emailOrUsername = SocialPhase3EndpointsTests.TargetUsername, password = SocialPhase3EndpointsTests.TargetPassword });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // --- L6: Admin bans from user-report flow ---

    [Fact]
    public async Task Admin_Ban7Days_WhileResolvingUserReport()
    {
        await SeedTargetUserAsync();
        var targetId = SocialPhase3EndpointsTests.TargetUserId;

        var studentToken = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);
        await _client.PostAsJsonAsync(
            $"/api/v1/users/{targetId}/report",
            new ReportUserRequest
            {
                Source = "profile",
                Reason = "harassment",
                Detail = "Admin ban from report queue E2E test detail."
            });

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var banResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetId}/ban",
            new ModeratorBanUserRequest { DurationDays = 7, Reason = "Admin ban from user report E2E." });
        banResponse.EnsureSuccessStatusCode();

        var queueResponse = await _client.GetAsync("/api/v1/admin/moderation/user-reports?status=Pending&page=1&pageSize=50");
        var queue = await queueResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<UserReportDto>>>();
        var report = queue!.Data!.Items.First(r => r.ReportedUserId == targetId);

        var resolveResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/user-reports/{report.Id}",
            new ResolveUserReportRequest { Status = "Resolved", ResolutionNote = "banned_7d" });
        resolveResponse.EnsureSuccessStatusCode();

        var bannedList = await _client.GetAsync("/api/v1/admin/moderation/banned");
        bannedList.EnsureSuccessStatusCode();
        var bannedBody = await bannedList.Content.ReadFromJsonAsync<ApiResponse<IReadOnlyList<BannedUserDto>>>();
        bannedBody!.Data!.Should().Contain(u =>
            u.UserId == targetId && u.BanType == BanType.Temp.ToString());
    }

    // --- L7-L8: Admin permanent ban ---

    [Fact]
    public async Task Admin_PermanentBan_AppearsInBannedList()
    {
        await SeedTargetUserAsync();
        var targetId = SocialPhase3EndpointsTests.TargetUserId;

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var patchResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/users/{targetId}",
            new AdminUserPatchRequest
            {
                IsBanned = true,
                BanType = BanType.Permanent.ToString(),
                BanReason = "Permanent ban E2E integration test with audit reason."
            });
        patchResponse.EnsureSuccessStatusCode();
        var patched = await patchResponse.Content.ReadFromJsonAsync<ApiResponse<AdminUserDetailDto>>();
        patched!.Data!.IsBanned.Should().BeTrue();
        patched.Data.BanType.Should().Be(BanType.Permanent.ToString());

        var bannedList = await _client.GetAsync("/api/v1/admin/moderation/banned");
        bannedList.EnsureSuccessStatusCode();
        var bannedBody = await bannedList.Content.ReadFromJsonAsync<ApiResponse<IReadOnlyList<BannedUserDto>>>();
        bannedBody!.Data!.Should().Contain(u =>
            u.UserId == targetId && u.BanType == BanType.Permanent.ToString());
    }

    // --- L9: Admin unban from moderation API ---

    [Fact]
    public async Task Admin_Unban_RemovesFromActiveBannedList()
    {
        await SeedTargetUserAsync();
        var targetId = SocialPhase3EndpointsTests.TargetUserId;

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        await _client.PatchAsJsonAsync(
            $"/api/v1/admin/users/{targetId}",
            new AdminUserPatchRequest
            {
                IsBanned = true,
                BanType = BanType.Permanent.ToString(),
                BanReason = "Temporary permanent ban for unban E2E test."
            });

        var unbanResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetId}/unban",
            new UnbanUserRequest { Note = "Admin unban E2E" });
        unbanResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = null;
        var loginResponse = await _client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { emailOrUsername = SocialPhase3EndpointsTests.TargetUsername, password = SocialPhase3EndpointsTests.TargetPassword });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // --- L10: Mod cannot ban admin ---

    [Fact]
    public async Task Moderator_CannotBanAdmin_ReturnsForbidden()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{CustomWebApplicationFactory.AdminUserId}/ban",
            new ModeratorBanUserRequest { DurationDays = 7, Reason = "Mod should not ban admin account." });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // --- L11: Mod cannot unban permanent ---

    [Fact]
    public async Task Moderator_CannotUnbanPermanentBan_ReturnsForbidden()
    {
        await SeedTargetUserAsync();
        var targetId = SocialPhase3EndpointsTests.TargetUserId;

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        await _client.PatchAsJsonAsync(
            $"/api/v1/admin/users/{targetId}",
            new AdminUserPatchRequest
            {
                IsBanned = true,
                BanType = BanType.Permanent.ToString(),
                BanReason = "Permanent ban for mod-unban negative E2E test."
            });

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var unbanResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{targetId}/unban",
            new UnbanUserRequest { Note = "Mod should not unban permanent" });

        unbanResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // --- L12: Ban without reason ---

    [Fact]
    public async Task BanWithoutReason_ReturnsBadRequest()
    {
        await SeedTargetUserAsync();

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/admin/moderation/users/{SocialPhase3EndpointsTests.TargetUserId}/ban",
            new ModeratorBanUserRequest { DurationDays = 7, Reason = "" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task SeedTargetUserAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var existing = await userManager.FindByIdAsync(SocialPhase3EndpointsTests.TargetUserId.ToString());
        if (existing is not null)
        {
            await ResetTargetUserBanStateAsync(context, existing);
            return;
        }

        var bronzeLevel = await context.LevelConfigs.OrderBy(l => l.MinPoints).FirstAsync();
        var user = new ApplicationUser
        {
            Id = SocialPhase3EndpointsTests.TargetUserId,
            UserName = SocialPhase3EndpointsTests.TargetUsername,
            Email = "phase3target@test.local",
            EmailConfirmed = true,
            DisplayName = "Phase3 Target",
            LevelId = bronzeLevel.Id
        };

        await userManager.CreateAsync(user, SocialPhase3EndpointsTests.TargetPassword);
        await userManager.AddToRoleAsync(user, RoleNames.Student);
    }

    private static async Task ResetTargetUserBanStateAsync(SEHubDbContext context, ApplicationUser user)
    {
        user.IsBanned = false;
        user.BanUntil = null;
        user.BanReason = null;
        await context.SaveChangesAsync();
    }

    private async Task<Guid> CreateApprovedPostAsync(string title)
    {
        var studentToken = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = title,
            Content = $"Content for {title}",
            Tags = ["e2e-moderation"]
        });
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var postId = (await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>())!.Data!.Id;

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);
        await _client.PatchAsJsonAsync(
            $"/api/v1/admin/moderation/posts/{postId}",
            new ModeratePostRequest { Action = "approve", Note = "Approved for E2E moderation test." });

        return postId;
    }

    private async Task SeedExamQuestionAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        if (await context.Questions.AnyAsync(q => q.Id == QuestionId))
        {
            return;
        }

        var optionId = Guid.NewGuid();
        context.Questions.Add(new Question
        {
            Id = QuestionId,
            ExamId = CustomWebApplicationFactory.PublishedExamId,
            Content = "What is 2 + 2?",
            QuestionType = QuestionType.SingleChoice,
            CorrectOptionId = optionId,
            CreatedAt = DateTime.UtcNow,
            Options =
            [
                new QuestionOption
                {
                    Id = optionId,
                    QuestionId = QuestionId,
                    Label = "A",
                    Text = "4",
                }
            ]
        });

        await context.SaveChangesAsync();
    }

    private async Task<string> LoginTargetUserAsync()
    {
        var payload = JsonSerializer.Serialize(new
        {
            emailOrUsername = SocialPhase3EndpointsTests.TargetUsername,
            password = SocialPhase3EndpointsTests.TargetPassword
        });

        using var response = await _client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(payload, Encoding.UTF8, "application/json"));

        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);
        return document.RootElement
            .GetProperty("data")
            .GetProperty("accessToken")
            .GetString()!;
    }
}
