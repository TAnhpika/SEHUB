using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Enums;

namespace SEHub.API.IntegrationTests.Exams;

public sealed class QuestionImagesEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public QuestionImagesEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateExam_WithInlineImg_StripsImagesFromQuestionContent()
    {
        var token = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var optionA = Guid.NewGuid();
        var optionB = Guid.NewGuid();
        var paper = $"INT-QIMG-{Guid.NewGuid():N}"[..24];

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "PRF192",
            PaperCode = paper,
            ExamType = nameof(ExamType.Final),
            Description = "Question image strip test",
            Questions =
            [
                new CreateExamQuestionItem
                {
                    OrderIndex = 1,
                    Content = "<p>Hello</p><img src=\"https://res.cloudinary.com/demo/image/upload/sample.jpg\" alt=\"x\">",
                    CorrectOptionId = optionA,
                    Options =
                    [
                        new CreateExamOptionItem { Id = optionA, Label = "A", Text = "1" },
                        new CreateExamOptionItem { Id = optionB, Label = "B", Text = "2" }
                    ]
                }
            ]
        });

        createResponse.EnsureSuccessStatusCode();
        var body = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var question = body!.Data!.Questions.Should().ContainSingle().Subject;
        question.Content.Should().NotContain("<img");
        question.Content.Should().NotContain("cloudinary.com");
        question.Content.Should().Contain("Hello");
        question.Images.Should().BeEmpty();
    }

    [Fact]
    public async Task UploadAndDeleteQuestionImages_ModeratorFlow_Succeeds()
    {
        var token = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var optionA = Guid.NewGuid();
        var optionB = Guid.NewGuid();
        var paper = $"INT-QGAL-{Guid.NewGuid():N}"[..24];

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/exams", new CreateExamRequest
        {
            SubjectCode = "PRF192",
            PaperCode = paper,
            ExamType = nameof(ExamType.Final),
            Description = "Gallery upload test",
            Questions =
            [
                new CreateExamQuestionItem
                {
                    OrderIndex = 1,
                    Content = "<p>Text only</p>",
                    CorrectOptionId = optionA,
                    ImageUrls = ["https://res.cloudinary.com/demo/image/upload/kept.jpg"],
                    Options =
                    [
                        new CreateExamOptionItem { Id = optionA, Label = "A", Text = "1" },
                        new CreateExamOptionItem { Id = optionB, Label = "B", Text = "2" }
                    ]
                }
            ]
        });

        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        var question = created!.Data!.Questions.Should().ContainSingle().Subject;
        question.Images.Should().HaveCount(1);
        question.Images[0].ImagePath.Should().Contain("kept.jpg");
        var questionId = question.Id;

        using var form = new MultipartFormDataContent();
        var bytes = Encoding.UTF8.GetBytes("fake-question-image");
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form.Add(fileContent, "files", "diagram.jpg");

        var uploadResponse = await _client.PostAsync(
            $"/api/v1/admin/exams/questions/{questionId}/images",
            form);
        uploadResponse.EnsureSuccessStatusCode();
        var uploaded = await uploadResponse.Content.ReadFromJsonAsync<ApiResponse<List<QuestionImageDto>>>();
        uploaded!.Data.Should().HaveCount(1);
        var newImageId = uploaded.Data![0].Id;

        var detailResponse = await _client.GetAsync($"/api/v1/admin/exams/{created.Data.Id}");
        detailResponse.EnsureSuccessStatusCode();
        var detail = await detailResponse.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        detail!.Data!.Questions[0].Images.Should().HaveCount(2);
        detail.Data.Questions[0].Content.Should().NotContain("<img");

        var deleteResponse = await _client.DeleteAsync(
            $"/api/v1/admin/exams/questions/{questionId}/images/{newImageId}");
        deleteResponse.EnsureSuccessStatusCode();

        var afterDelete = await _client.GetAsync($"/api/v1/admin/exams/{created.Data.Id}");
        var afterBody = await afterDelete.Content.ReadFromJsonAsync<ApiResponse<AdminExamDto>>();
        afterBody!.Data!.Questions[0].Images.Should().HaveCount(1);
    }

    [Fact]
    public async Task DeleteQuestionImage_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.DeleteAsync(
            $"/api/v1/admin/exams/questions/{Guid.NewGuid()}/images/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
