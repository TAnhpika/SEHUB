using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Enums;

namespace SEHub.API.IntegrationTests.Exams;

public sealed class ModeratorExamIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ModeratorExamIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Moderator_CreatePracticeExam_ReturnsPendingApproval()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var response = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            Code = $"INT-MOD-PRAC-{Guid.NewGuid():N}"[..20],
            Title = "Moderator practice contribution",
            ExamType = nameof(ExamType.Practice),
            Semester = "3",
            Major = "PRF192",
            Description = "Integration test practice exam from moderator."
        });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        body!.Data!.Status.Should().Be(nameof(ExamStatus.PendingApproval));
    }

    [Fact]
    public async Task Moderator_GetMyExams_ReturnsOwnPendingSubmissions()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var uniqueCode = $"INT-MOD-MINE-{Guid.NewGuid():N}"[..20];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            Code = uniqueCode,
            Title = "Mine filter test",
            ExamType = nameof(ExamType.Final),
            Semester = "2",
            Major = "MAE101",
            Description = "Final exam pending approval.",
            Questions =
            [
                new CreateExamQuestionItem
                {
                    OrderIndex = 1,
                    Content = "2 + 2 = ?",
                    CorrectOptionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"),
                    Options =
                    [
                        new CreateExamOptionItem
                        {
                            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"),
                            Label = "A",
                            Text = "4"
                        },
                        new CreateExamOptionItem
                        {
                            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1"),
                            Label = "B",
                            Text = "5"
                        }
                    ]
                }
            ]
        });
        createResponse.EnsureSuccessStatusCode();

        var listResponse = await _client.GetAsync("/api/v1/admin/exams?mine=true&status=PendingApproval&pageSize=50");
        listResponse.EnsureSuccessStatusCode();
        var list = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ExamListItemDto>>>();
        list!.Data!.Items.Should().Contain(e => e.Code == uniqueCode);
        list.Data.Items.Should().OnlyContain(e => e.Status == nameof(ExamStatus.PendingApproval));
    }

    [Fact]
    public async Task Admin_ListPendingExams_IncludesAssetUrlAndDescription()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var uniqueCode = $"INT-LIST-ASSET-{Guid.NewGuid():N}"[..24];
        const string assetUrl = "/uploads/exams/integration-test-brief.pdf";
        const string description = "Practice exam with attachment for admin list.";

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            Code = uniqueCode,
            Title = "List asset metadata test",
            ExamType = nameof(ExamType.Practice),
            Semester = "5",
            Major = "PRF192",
            Description = description,
            AssetUrl = assetUrl,
        });
        createResponse.EnsureSuccessStatusCode();

        var listResponse = await _client.GetAsync("/api/v1/admin/exams?status=PendingApproval&pageSize=50");
        listResponse.EnsureSuccessStatusCode();
        var list = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ExamListItemDto>>>();
        var item = list!.Data!.Items.Should().ContainSingle(e => e.Code == uniqueCode).Subject;
        item.AssetUrl.Should().Be(assetUrl);
        item.Description.Should().Be(description);
    }

    [Fact]
    public async Task Moderator_ReviewPracticeSubmission_AcceptsReviewedStatus()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var response = await _client.PatchAsJsonAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PracticeExamId}/practice-submissions/{CustomWebApplicationFactory.PracticeSubmissionId}",
            new ReviewPracticeRequest
            {
                Status = nameof(PracticeSubmissionStatus.Reviewed),
                ReviewerComment = "Reviewed during integration test."
            });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PracticeSubmissionDto>>();
        body!.Data!.Status.Should().Be(nameof(PracticeSubmissionStatus.Reviewed));
    }
}
