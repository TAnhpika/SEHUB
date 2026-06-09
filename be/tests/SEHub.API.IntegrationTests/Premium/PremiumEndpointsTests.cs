using System.Net;
using System.Net.Http.Headers;

namespace SEHub.API.IntegrationTests.Premium;

public sealed class PremiumEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PremiumEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task StartExamAttempt_AsFreeUser_ReturnsForbidden()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PostAsync(
            $"/api/v1/exams/{CustomWebApplicationFactory.PublishedExamId}/attempts",
            null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
