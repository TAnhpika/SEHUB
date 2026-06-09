using System.Net;
using System.Net.Http.Headers;

namespace SEHub.API.IntegrationTests.Exams;

public sealed class ExamQuestionsEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ExamQuestionsEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetQuestions_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PublishedExamId}/questions");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetQuestions_AsFreeUser_ReturnsOk()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PublishedExamId}/questions");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
