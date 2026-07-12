using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Identity;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Admin;

public sealed class RoleChangeAuditEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public RoleChangeAuditEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PatchRole_StudentToModerator_WritesGrantAudit_AndListReturnsIt()
    {
        var target = await CreateStudentAsync($"grant-{Guid.NewGuid():N}"[..12]);

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var patchResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/admin/users/{target.Id}",
            new AdminUserPatchRequest { Role = RoleNames.Moderator });
        patchResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
            var audits = await context.RoleChangeAudits
                .Where(a => a.TargetUserId == target.Id)
                .ToListAsync();
            audits.Should().HaveCount(1);
            audits[0].Action.Should().Be(RoleChangeAuditActions.GrantModerator);
            audits[0].FromRole.Should().Be(RoleNames.Student);
            audits[0].ToRole.Should().Be(RoleNames.Moderator);
            audits[0].ActorId.Should().Be(CustomWebApplicationFactory.AdminUserId);
            audits[0].Detail.Should().Contain(target.UserName);
        }

        var listResponse = await _client.GetAsync("/api/v1/admin/role-audits?page=1&pageSize=50");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var listBody = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<RoleChangeAuditItemDto>>>();
        listBody!.Success.Should().BeTrue();
        listBody.Data!.Items.Should().Contain(item =>
            item.TargetUsername == target.UserName
            && item.Action == RoleChangeAuditActions.GrantModerator
            && item.ActorUsername != null);
    }

    [Fact]
    public async Task PatchRole_ModeratorToStudent_WritesRevokeAudit_OrderedNewestFirst()
    {
        var target = await CreateStudentAsync($"revoke-{Guid.NewGuid():N}"[..12]);

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        (await _client.PatchAsJsonAsync(
            $"/api/v1/admin/users/{target.Id}",
            new AdminUserPatchRequest { Role = RoleNames.Moderator })).EnsureSuccessStatusCode();

        (await _client.PatchAsJsonAsync(
            $"/api/v1/admin/users/{target.Id}",
            new AdminUserPatchRequest { Role = RoleNames.Student })).EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var audits = await context.RoleChangeAudits
            .Where(a => a.TargetUserId == target.Id)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        audits.Should().HaveCount(2);
        audits[0].Action.Should().Be(RoleChangeAuditActions.RevokeModerator);
        audits[1].Action.Should().Be(RoleChangeAuditActions.GrantModerator);
    }

    [Fact]
    public async Task RoleChangeAudit_IsAppendOnly_RejectsUpdateAndDelete()
    {
        var target = await CreateStudentAsync($"append-{Guid.NewGuid():N}"[..12]);

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        (await _client.PatchAsJsonAsync(
            $"/api/v1/admin/users/{target.Id}",
            new AdminUserPatchRequest { Role = RoleNames.Moderator })).EnsureSuccessStatusCode();

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var audit = await context.RoleChangeAudits.SingleAsync(a => a.TargetUserId == target.Id);

        audit.Detail = "tampered";
        var modify = async () => await context.SaveChangesAsync();
        await modify.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*append-only*");

        context.ChangeTracker.Clear();
        var fresh = await context.RoleChangeAudits.SingleAsync(a => a.Id == audit.Id);
        context.RoleChangeAudits.Remove(fresh);
        var delete = async () => await context.SaveChangesAsync();
        await delete.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*append-only*");
    }

    private async Task<ApplicationUser> CreateStudentAsync(string username)
    {
        using var scope = _factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var bronze = await context.LevelConfigs.OrderBy(l => l.MinPoints).FirstAsync();

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = username,
            Email = $"{username}@test.local",
            EmailConfirmed = true,
            DisplayName = username,
            LevelId = bronze.Id,
        };

        var create = await userManager.CreateAsync(user, "Student@Test123");
        create.Succeeded.Should().BeTrue(string.Join(", ", create.Errors.Select(e => e.Description)));
        await userManager.AddToRoleAsync(user, RoleNames.Student);

        context.UserProfiles.Add(new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        return user;
    }
}
