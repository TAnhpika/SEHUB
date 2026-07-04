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
            Code = "PRF192",
            Title = $"INT-MOD-PRAC-{Guid.NewGuid():N}"[..24],
            ExamType = nameof(ExamType.Practice),
            Semester = "3",
            Major = "SE",
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

        var uniquePaper = $"INT-MOD-MINE-{Guid.NewGuid():N}"[..24];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            Code = "MAE101",
            Title = uniquePaper,
            ExamType = nameof(ExamType.Final),
            Semester = "2",
            Major = "SE",
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
        list!.Data!.Items.Should().Contain(e => e.Title == uniquePaper);
        list.Data.Items.Should().OnlyContain(e => e.Status == nameof(ExamStatus.PendingApproval));
    }

    [Fact]
    public async Task Admin_ListPendingExams_IncludesDescription_AndDriveAttachmentAfterUpload()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var uniquePaper = $"INT-LIST-ATT-{Guid.NewGuid():N}"[..24];
        const string description = "Practice exam with Drive attachment for admin list.";

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            Code = "PRF192",
            Title = uniquePaper,
            ExamType = nameof(ExamType.Practice),
            Semester = "5",
            Major = "SE",
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
        var item = list!.Data!.Items.Should().ContainSingle(e => e.Title == uniquePaper).Subject;
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

    [Fact]
    public async Task Moderator_ImportMarkdown_PlainCauHeader_ReturnsParsedQuestions()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        const string markdown = """
            Câu 30
            Chọn trong A, B, C, D đáp án thích hợp để điền vào chỗ trống で しんぶんをかいます。
            A. うち
            B. うみ
            C. コンビニ
            D. じゅぎょう

            Đáp án: C
            """;

        var response = await _client.PostAsJsonAsync(
            "/api/v1/admin/exams/import-markdown",
            new ImportExamMarkdownRequest { Markdown = markdown });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<ImportExamMarkdownResponse>>();
        body!.Data!.QuestionCount.Should().Be(1);
        body.Data.Questions[0].OrderIndex.Should().Be(30);
        body.Data.Questions[0].Options.Should().Contain(o => o.Label == "C" && o.Text == "コンビニ");
    }

    [Fact]
    public async Task Admin_PendingList_IncludesSubmittedByUsername()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var uniquePaper = $"INT-SUBMITTER-{Guid.NewGuid():N}"[..24];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            Code = "PRF192",
            Title = uniquePaper,
            ExamType = nameof(ExamType.Practice),
            Semester = "3",
            Major = "SE",
            Description = "Pending list submitter username test."
        });
        createResponse.EnsureSuccessStatusCode();

        var listResponse = await _client.GetAsync("/api/v1/admin/exams?status=PendingApproval&pageSize=50");
        listResponse.EnsureSuccessStatusCode();
        var list = await listResponse.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ExamListItemDto>>>();
        var item = list!.Data!.Items.Should().ContainSingle(e => e.Title == uniquePaper).Subject;
        item.SubmittedByUsername.Should().Be("moderator");
        item.SubmittedByDisplayName.Should().Be("Test Moderator");
    }

    [Fact]
    public async Task FinalExam_RevisionApprove_ReplacesPublishedExam_AndArchivesParent()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var liveTitle = $"INT-FINAL-REV-{Guid.NewGuid():N}"[..24];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", BuildFinalExamRequest(liveTitle));
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var examId = created!.Data!.Id;

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var approveResponse = await _client.PostAsync($"/api/v1/admin/exams/{examId}/approve", null);
        approveResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var revisionResponse = await _client.PostAsync($"/api/v1/admin/exams/{examId}/revision", null);
        revisionResponse.EnsureSuccessStatusCode();
        var revision = await revisionResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        revision!.Data!.Status.Should().Be(nameof(ExamStatus.Draft));
        revision.Data.RevisionOfExamId.Should().Be(examId);

        const string updatedDescription = "Final revision resubmit description.";
        var resubmitResponse = await _client.PutAsJsonAsync(
            $"/api/v1/admin/exams/{revision.Data.Id}/resubmit",
            new ResubmitExamRequest
            {
                Title = revision.Data.Title,
                Description = updatedDescription,
                Questions = []
            });
        resubmitResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var approveRevisionResponse = await _client.PostAsync($"/api/v1/admin/exams/{revision.Data.Id}/approve", null);
        approveRevisionResponse.EnsureSuccessStatusCode();
        var approvedRevision = await approveRevisionResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        approvedRevision!.Data!.Status.Should().Be(nameof(ExamStatus.Published));
        approvedRevision.Data.Title.Should().Be(liveTitle);
        approvedRevision.Data.Description.Should().Be(updatedDescription);

        var parentResponse = await _client.GetAsync($"/api/v1/admin/exams/{examId}");
        parentResponse.EnsureSuccessStatusCode();
        var parent = await parentResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        parent!.Data!.Status.Should().Be(nameof(ExamStatus.Archived));
        parent.Data.Title.Should().StartWith($"{liveTitle}-ARCH-");
    }

    [Fact]
    public async Task PracticeExam_RevisionApprove_ClonesAttachments_AndReplacesPublishedExam()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var liveTitle = $"INT-PRAC-REV-{Guid.NewGuid():N}"[..24];
        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            Code = "PRF192",
            Title = liveTitle,
            ExamType = nameof(ExamType.Practice),
            Semester = "4",
            Major = "SE",
            Description = "Practice revision integration test."
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var examId = created!.Data!.Id;

        using var uploadContent = new MultipartFormDataContent();
        var pdfBytes = "%PDF-1.4\n%%EOF"u8.ToArray();
        var fileContent = new ByteArrayContent(pdfBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        uploadContent.Add(fileContent, "file", "revision-source-brief.pdf");

        var uploadResponse = await _client.PostAsync($"/api/v1/admin/exams/{examId}/attachments", uploadContent);
        uploadResponse.EnsureSuccessStatusCode();

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var approveResponse = await _client.PostAsync($"/api/v1/admin/exams/{examId}/approve", null);
        approveResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var revisionResponse = await _client.PostAsync($"/api/v1/admin/exams/{examId}/revision", null);
        revisionResponse.EnsureSuccessStatusCode();
        var revision = await revisionResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var revisionId = revision!.Data!.Id;

        var revisionDetailResponse = await _client.GetAsync($"/api/v1/admin/exams/{revisionId}");
        revisionDetailResponse.EnsureSuccessStatusCode();
        var revisionDetail = await revisionDetailResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        revisionDetail!.Data!.Attachments.Should().ContainSingle(a => a.OriginalFileName == "revision-source-brief.pdf");

        const string updatedDescription = "Practice revision resubmit description.";
        var resubmitResponse = await _client.PutAsJsonAsync(
            $"/api/v1/admin/exams/{revisionId}/resubmit",
            new ResubmitExamRequest
            {
                Title = revision.Data.Title,
                Description = updatedDescription,
                Questions = []
            });
        resubmitResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var approveRevisionResponse = await _client.PostAsync($"/api/v1/admin/exams/{revisionId}/approve", null);
        approveRevisionResponse.EnsureSuccessStatusCode();
        var approvedRevision = await approveRevisionResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        approvedRevision!.Data!.Status.Should().Be(nameof(ExamStatus.Published));
        approvedRevision.Data.Title.Should().Be(liveTitle);
        approvedRevision.Data.Description.Should().Be(updatedDescription);
        approvedRevision.Data.Attachments.Should().ContainSingle(a => a.OriginalFileName == "revision-source-brief.pdf");

        var parentResponse = await _client.GetAsync($"/api/v1/admin/exams/{examId}");
        parentResponse.EnsureSuccessStatusCode();
        var parent = await parentResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        parent!.Data!.Status.Should().Be(nameof(ExamStatus.Archived));
    }

    private static CreateExamRequest BuildFinalExamRequest(string title) => new()
    {
        Code = "MAE101",
        Title = title,
        ExamType = nameof(ExamType.Final),
        Semester = "2",
        Major = "SE",
        Description = $"Final exam revision integration test. {title}",
        Questions = BuildFinalExamQuestionItems(title)
    };

    private static IReadOnlyList<CreateExamQuestionItem> BuildFinalExamQuestionItems(string? uniqueSeed = null)
    {
        var seed = uniqueSeed ?? Guid.NewGuid().ToString("N");
        return
        [
            new CreateExamQuestionItem
            {
                OrderIndex = 1,
                Content = $"2 + 2 = ? ({seed})",
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
        ];
    }
}
