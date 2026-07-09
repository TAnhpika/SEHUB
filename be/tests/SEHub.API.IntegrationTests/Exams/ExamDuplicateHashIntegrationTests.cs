using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Enums;

namespace SEHub.API.IntegrationTests.Exams;

public sealed class ExamDuplicateHashIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ExamDuplicateHashIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateExam_WithIdenticalQuestions_Returns409_ThenSucceedsWithConfirmDuplicate()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var uniquePaper = $"INT-DUP-{Guid.NewGuid():N}"[..20];
        var optionAId = Guid.NewGuid();
        var optionBId = Guid.NewGuid();
        var request = new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = uniquePaper,
            ExamType = nameof(ExamType.Final),
            Description = "Duplicate hash integration test.",
            Questions =
            [
                new CreateExamQuestionItem
                {
                    OrderIndex = 1,
                    Content = $"What is 2+2? ({uniquePaper})",
                    CorrectOptionId = optionAId,
                    Options =
                    [
                        new CreateExamOptionItem { Id = optionAId, Label = "A", Text = "4" },
                        new CreateExamOptionItem { Id = optionBId, Label = "B", Text = "5" },
                    ],
                },
            ],
        };

        var first = await _client.PostAsJsonAsync("/api/v1/admin/exams", request);
        first.EnsureSuccessStatusCode();

        var duplicateTitle = $"INT-DUP2-{Guid.NewGuid():N}"[..20];
        var duplicateRequest = new CreateExamRequest
        {
            SubjectCode = request.SubjectCode,
            PaperCode = duplicateTitle,
            ExamType = request.ExamType,
            Description = request.Description,
            Questions = [CloneQuestionWithFreshOptionIds(request.Questions[0])],
        };

        var conflict = await _client.PostAsJsonAsync("/api/v1/admin/exams", duplicateRequest);
        conflict.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var allowed = await _client.PostAsJsonAsync(
            "/api/v1/admin/exams?confirmDuplicate=true",
            duplicateRequest);
        allowed.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task UpdateExam_WithIdenticalQuestionsToAnotherExam_Returns409()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);

        var seed = Guid.NewGuid().ToString("N")[..8];
        var optionAId = Guid.NewGuid();
        var optionBId = Guid.NewGuid();
        var sharedQuestion = new CreateExamQuestionItem
        {
            OrderIndex = 1,
            Content = $"Shared stem {seed}",
            CorrectOptionId = optionAId,
            Options =
            [
                new CreateExamOptionItem { Id = optionAId, Label = "A", Text = "Yes" },
                new CreateExamOptionItem { Id = optionBId, Label = "B", Text = "No" },
            ],
        };

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = $"INT-UPD-A-{seed}",
            ExamType = nameof(ExamType.Final),
            Questions = [sharedQuestion],
        });
        firstResponse.EnsureSuccessStatusCode();

        var optionCId = Guid.NewGuid();
        var optionDId = Guid.NewGuid();
        var secondResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = $"INT-UPD-B-{seed}",
            ExamType = nameof(ExamType.Final),
            Questions =
            [
                new CreateExamQuestionItem
                {
                    OrderIndex = 1,
                    Content = $"Different stem {seed}",
                    CorrectOptionId = optionDId,
                    Options =
                    [
                        new CreateExamOptionItem { Id = optionCId, Label = "A", Text = "Yes" },
                        new CreateExamOptionItem { Id = optionDId, Label = "B", Text = "No" },
                    ],
                },
            ],
        });
        secondResponse.EnsureSuccessStatusCode();
        var secondBody = await secondResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var secondId = secondBody!.Data!.Id;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var updateConflict = await _client.PutAsJsonAsync(
            $"/api/v1/admin/exams/{secondId}",
            new UpdateExamRequest { Questions = [BuildSharedQuestionCopy(seed)] });
        updateConflict.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var updateAllowed = await _client.PutAsJsonAsync(
            $"/api/v1/admin/exams/{secondId}?confirmDuplicate=true",
            new UpdateExamRequest { Questions = [BuildSharedQuestionCopy(seed)] });
        updateAllowed.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ResubmitRejectedExam_WithIdenticalQuestionsToAnotherExam_Returns409_ThenSucceedsWithConfirmDuplicate()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        var seed = Guid.NewGuid().ToString("N")[..8];
        var sharedQuestion = BuildSharedQuestionCopy(seed);

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = $"INT-RESUB-A-{seed}",
            ExamType = nameof(ExamType.Final),
            Questions = [sharedQuestion],
        });
        firstResponse.EnsureSuccessStatusCode();

        var optionCId = Guid.NewGuid();
        var optionDId = Guid.NewGuid();
        var secondResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = $"INT-RESUB-B-{seed}",
            ExamType = nameof(ExamType.Final),
            Questions =
            [
                new CreateExamQuestionItem
                {
                    OrderIndex = 1,
                    Content = $"Different stem {seed}",
                    CorrectOptionId = optionDId,
                    Options =
                    [
                        new CreateExamOptionItem { Id = optionCId, Label = "A", Text = "Yes" },
                        new CreateExamOptionItem { Id = optionDId, Label = "B", Text = "No" },
                    ],
                },
            ],
        });
        secondResponse.EnsureSuccessStatusCode();
        var secondBody = await secondResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var rejectedExamId = secondBody!.Data!.Id;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var rejectResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/exams/{rejectedExamId}/reject",
            new RejectExamRequest
            {
                ReasonCode = "QUALITY",
                ReasonLabel = "Quality issue",
                Detail = "Integration duplicate resubmit test.",
            });
        rejectResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);
        var resubmitConflict = await _client.PutAsJsonAsync(
            $"/api/v1/admin/exams/{rejectedExamId}/resubmit",
            new ResubmitExamRequest
            {
                PaperCode = $"INT-RESUB-B-{seed}",
                Questions = [BuildSharedQuestionCopy(seed)],
            });
        resubmitConflict.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var resubmitAllowed = await _client.PutAsJsonAsync(
            $"/api/v1/admin/exams/{rejectedExamId}/resubmit?confirmDuplicate=true",
            new ResubmitExamRequest
            {
                PaperCode = $"INT-RESUB-B-{seed}",
                Questions = [BuildSharedQuestionCopy(seed)],
            });
        resubmitAllowed.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ApproveTwoPendingExams_WithSameContentHash_AllowsBothPublished()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        var seed = Guid.NewGuid().ToString("N")[..8];
        var sharedQuestion = BuildSharedQuestionCopy(seed);

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = $"INT-RACE-A-{seed}",
            ExamType = nameof(ExamType.Final),
            Questions = [sharedQuestion],
        });
        firstResponse.EnsureSuccessStatusCode();
        var firstBody = await firstResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var firstId = firstBody!.Data!.Id;

        var secondResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/exams?confirmDuplicate=true",
            new CreateExamRequest
            {
                SubjectCode = "MAE101",
                PaperCode = $"INT-RACE-B-{seed}",
                ExamType = nameof(ExamType.Final),
                Questions = [BuildSharedQuestionCopy(seed)],
            });
        secondResponse.EnsureSuccessStatusCode();
        var secondBody = await secondResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var secondId = secondBody!.Data!.Id;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        (await _client.PostAsync($"/api/v1/admin/exams/{firstId}/approve", null)).EnsureSuccessStatusCode();
        (await _client.PostAsync($"/api/v1/admin/exams/{secondId}/approve", null)).EnsureSuccessStatusCode();

        var firstDetail = await _client.GetFromJsonAsync<ApiResponse<AdminExamDto>>($"/api/v1/admin/exams/{firstId}");
        var secondDetail = await _client.GetFromJsonAsync<ApiResponse<AdminExamDto>>($"/api/v1/admin/exams/{secondId}");

        firstDetail!.Data!.Status.Should().Be(nameof(ExamStatus.Published));
        secondDetail!.Data!.Status.Should().Be(nameof(ExamStatus.Published));
        firstDetail.Data.ContentHash.Should().Be(secondDetail.Data.ContentHash);
    }

    [Fact]
    public async Task CreateExam_WhenArchivedExamHasSameContentHash_Returns409()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        var seed = Guid.NewGuid().ToString("N")[..8];
        var sharedQuestion = BuildSharedQuestionCopy(seed);
        var livePaperCode = $"INT-ARCH-{seed}";

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = livePaperCode,
            ExamType = nameof(ExamType.Final),
            Questions = [sharedQuestion],
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var liveExamId = created!.Data!.Id;

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        (await _client.PostAsync($"/api/v1/admin/exams/{liveExamId}/approve", null)).EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);
        var revisionResponse = await _client.PostAsync($"/api/v1/admin/exams/{liveExamId}/revision", null);
        revisionResponse.EnsureSuccessStatusCode();
        var revision = await revisionResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var revisionId = revision!.Data!.Id;

        var resubmitResponse = await _client.PutAsJsonAsync(
            $"/api/v1/admin/exams/{revisionId}/resubmit",
            new ResubmitExamRequest
            {
                PaperCode = revision.Data.PaperCode,
                Description = revision.Data.Description,
                Questions = [],
            });
        resubmitResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        (await _client.PostAsync($"/api/v1/admin/exams/{revisionId}/approve", null)).EnsureSuccessStatusCode();

        var archivedParent = await _client.GetFromJsonAsync<ApiResponse<AdminExamDto>>($"/api/v1/admin/exams/{liveExamId}");
        archivedParent!.Data!.Status.Should().Be(nameof(ExamStatus.Archived));

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);
        var conflict = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "MAE101",
            PaperCode = $"INT-ARCH-NEW-{seed}",
            ExamType = nameof(ExamType.Final),
            Questions = [BuildSharedQuestionCopy(seed)],
        });
        conflict.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreatePracticeExam_WithSameDescriptionButDifferentPaperCode_DoesNotDuplicateHash()
    {
        var modToken = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", modToken);

        var seed = Guid.NewGuid().ToString("N")[..8];
        const string subjectCode = "PRF192";
        const string description = "Practice metadata duplicate audit test.";

        var firstResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = subjectCode,
            PaperCode = $"INT-PRAC-META-A-{seed}",
            ExamType = nameof(ExamType.Practice),
            Description = description,
        });
        firstResponse.EnsureSuccessStatusCode();

        var secondResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = subjectCode,
            PaperCode = $"INT-PRAC-META-B-{seed}",
            ExamType = nameof(ExamType.Practice),
            Description = description,
        });
        secondResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task OcrExam_WithMarkdownQuestions_ReturnsCanonicalHashAndQuestions()
    {
        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var markdown = """
            ## Câu 1
            1 + 1 = ?

            A. 1
            B. 2
            C. 3

            **Đáp án: B**
            """;

        var response = await _client.PostAsJsonAsync("/api/v1/admin/exams/ocr", new OcrExamRequest
        {
            Base64Image = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(markdown)),
        });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<OcrExamResponse>>();
        body.Should().NotBeNull();
        body!.Data.Should().NotBeNull();
        body.Data!.Questions.Should().HaveCount(1);
        body.Data.ContentHash.Should().NotBeNullOrWhiteSpace();
        body.Data.ContentHash.Length.Should().Be(64);
    }

    private static CreateExamQuestionItem BuildSharedQuestionCopy(string seed)
    {
        var optionAId = Guid.NewGuid();
        var optionBId = Guid.NewGuid();
        return new CreateExamQuestionItem
        {
            OrderIndex = 1,
            Content = $"Shared stem {seed}",
            CorrectOptionId = optionAId,
            Options =
            [
                new CreateExamOptionItem { Id = optionAId, Label = "A", Text = "Yes" },
                new CreateExamOptionItem { Id = optionBId, Label = "B", Text = "No" },
            ],
        };
    }

    private static CreateExamQuestionItem CloneQuestionWithFreshOptionIds(CreateExamQuestionItem source)
    {
        var options = source.Options
            .Select(option => new CreateExamOptionItem
            {
                Id = Guid.NewGuid(),
                Label = option.Label,
                Text = option.Text,
            })
            .ToList();

        var correctLabel = source.Options
            .First(option => option.Id == source.CorrectOptionId)
            .Label;

        var correctOption = options.First(option =>
            string.Equals(option.Label, correctLabel, StringComparison.OrdinalIgnoreCase));

        return new CreateExamQuestionItem
        {
            OrderIndex = source.OrderIndex,
            Content = source.Content,
            QuestionType = source.QuestionType,
            RequiredSelectCount = source.RequiredSelectCount,
            Options = options,
            CorrectOptionId = correctOption.Id,
            CorrectOptionIds = [correctOption.Id],
        };
    }
}
