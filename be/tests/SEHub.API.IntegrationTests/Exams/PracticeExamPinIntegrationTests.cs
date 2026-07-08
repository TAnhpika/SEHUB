using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Exams;

public sealed class PracticeExamPinIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly Guid PinnedSeedExamId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb001");

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PracticeExamPinIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PinNewPracticeExam_UnpinsExistingPinnedExamForSameSubject()
    {
        await SeedPinnedPracticeExamAsync();

        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var uniquePaper = $"INT-PIN-B-{Guid.NewGuid():N}"[..24];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = uniquePaper,
            ExamType = nameof(ExamType.Practice),
            Description = "Second pinned practice exam for pin integration test.",
            IsPinned = true
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        created!.Data!.IsPinned.Should().BeTrue();

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
            var previousPinned = await context.Exams.SingleAsync(e => e.Id == PinnedSeedExamId);
            previousPinned.IsPinned.Should().BeFalse();
            previousPinned.PinnedAt.Should().BeNull();
        }

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var approveResponse = await _client.PostAsync(
            $"/api/v1/admin/exams/{created.Data.Id}/approve",
            null);
        approveResponse.EnsureSuccessStatusCode();

        var listResponse = await _client.GetAsync("/api/v1/exams?code=MAE101&type=Practice&pageSize=20");
        listResponse.EnsureSuccessStatusCode();
        var list = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ExamListItemDto>>>();
        list!.Data!.Items.Should().NotBeEmpty();
        list.Data.Items[0].PaperCode.Should().Be(uniquePaper);
        list.Data.Items[0].IsPinned.Should().BeTrue();

        var previousItem = list.Data.Items.FirstOrDefault(e => e.Id == PinnedSeedExamId);
        previousItem.Should().NotBeNull();
        previousItem!.IsPinned.Should().BeFalse();
    }

    [Fact]
    public async Task Moderator_CreatePinnedPractice_Approve_ListShowsPinnedFirst()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var uniquePaper = $"INT-PIN-LIST-{Guid.NewGuid():N}"[..24];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "PRF192",
            PaperCode = uniquePaper,
            ExamType = nameof(ExamType.Practice),
            Description = "Pinned practice exam for public list ordering.",
            IsPinned = true
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        created!.Data!.Status.Should().Be(nameof(ExamStatus.PendingApproval));
        created.Data.IsPinned.Should().BeTrue();

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var approveResponse = await _client.PostAsync(
            $"/api/v1/admin/exams/{created.Data.Id}/approve",
            null);
        approveResponse.EnsureSuccessStatusCode();

        var listResponse = await _client.GetAsync("/api/v1/exams?code=PRF192&type=Practice&pageSize=50");
        listResponse.EnsureSuccessStatusCode();
        var list = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ExamListItemDto>>>();
        var pinnedItem = list!.Data!.Items.Should().ContainSingle(e => e.PaperCode == uniquePaper).Subject;
        pinnedItem.IsPinned.Should().BeTrue();
        list.Data.Items[0].Id.Should().Be(pinnedItem.Id);
    }

    private async Task SeedPinnedPracticeExamAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        if (await context.Exams.AnyAsync(e => e.Id == PinnedSeedExamId))
        {
            return;
        }

        context.Exams.Add(new Exam
        {
            Id = PinnedSeedExamId,
            SubjectCode = "MAE101",
            PaperCode = "INT-PIN-SEED-A",
            ExamType = ExamType.Practice,
            Status = ExamStatus.Published,
            ContentHash = "integration-pinned-practice-seed-a",
            Description = "Pinned practice exam seed for pin integration tests",
            IsPinned = true,
            PinnedAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        });

        await context.SaveChangesAsync();
    }
}
