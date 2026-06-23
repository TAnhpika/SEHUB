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
    public async Task Admin_ListPendingExams_IncludesDescription_AndDriveAttachmentAfterUpload()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var uniqueCode = $"INT-LIST-ATT-{Guid.NewGuid():N}"[..24];
        const string description = "Practice exam with Drive attachment for admin list.";

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            Code = uniqueCode,
            Title = "List attachment metadata test",
            ExamType = nameof(ExamType.Practice),
            Semester = "5",
            Major = "PRF192",
            Description = description,
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var examId = created!.Data!.Id;

        using var uploadContent = new MultipartFormDataContent();
        var pdfBytes = "%PDF-1.4\n%%EOF"u8.ToArray();
        var fileContent = new ByteArrayContent(pdfBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        uploadContent.Add(fileContent, "file", "integration-test-brief.pdf");

        var uploadResponse = await _client.PostAsync($"/api/v1/admin/exams/{examId}/attachments", uploadContent);
        uploadResponse.EnsureSuccessStatusCode();

        var detailResponse = await _client.GetAsync($"/api/v1/admin/exams/{examId}");
        detailResponse.EnsureSuccessStatusCode();
        var detail = await detailResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        detail!.Data!.Attachments.Should().ContainSingle(a => a.OriginalFileName == "integration-test-brief.pdf");

        var listResponse = await _client.GetAsync("/api/v1/admin/exams?status=PendingApproval&pageSize=50");
        listResponse.EnsureSuccessStatusCode();
        var list = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ExamListItemDto>>>();
        var item = list!.Data!.Items.Should().ContainSingle(e => e.Code == uniqueCode).Subject;
        item.Description.Should().Be(description);
        item.AssetUrl.Should().BeNull();
    }

    [Fact]
    public async Task Moderator_UploadAssetEndpoint_IsRemoved()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        using var uploadContent = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent("%PDF-1.4\n"u8.ToArray());
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        uploadContent.Add(fileContent, "file", "legacy.pdf");

        var response = await _client.PostAsync("/api/v1/admin/exams/upload-asset", uploadContent);
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.MethodNotAllowed);
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
