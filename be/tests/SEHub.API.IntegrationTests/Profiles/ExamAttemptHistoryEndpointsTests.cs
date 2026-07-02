using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using SEHub.Contracts.Common;
using SEHub.Contracts.Profiles;

namespace SEHub.API.IntegrationTests.Profiles;

public sealed class ExamAttemptHistoryEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ExamAttemptHistoryEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetMyExamAttempts_AsFreeUser_ReturnsForbidden()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/profiles/me/exam-attempts");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetMyExamAttempts_RequiresAuthentication()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.GetAsync("/api/v1/profiles/me/exam-attempts");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMyExamAttempts_AsModerator_ReturnsSubmittedFinalAttempts()
    {
        var token = await _factory.LoginModeratorAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/profiles/me/exam-attempts?page=1&pageSize=10");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<ExamAttemptHistoryItemDto>>>();
        body!.Success.Should().BeTrue();
        body.Data!.Items.Should().HaveCount(1);
        body.Data.Items[0].AttemptId.Should().Be(CustomWebApplicationFactory.SubmittedExamAttemptId);
        body.Data.Items[0].ExamId.Should().Be(CustomWebApplicationFactory.PublishedExamId);
        body.Data.Items[0].ExamCode.Should().Be("PRF192");
        body.Data.Items[0].ExamTitle.Should().Be("INT-FINAL-001");
        body.Data.Items[0].Major.Should().Be("SE");
        body.Data.Items[0].Semester.Should().Be(1);
        body.Data.Items[0].ScorePercent.Should().Be(76m);
        body.Data.Items[0].SubmittedAt.Should().NotBe(default);
        body.Data.TotalCount.Should().Be(1);
        body.Data.HasNextPage.Should().BeFalse();
    }
}
