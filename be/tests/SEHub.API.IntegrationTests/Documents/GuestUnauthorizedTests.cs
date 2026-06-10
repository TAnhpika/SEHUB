using System.Net;

namespace SEHub.API.IntegrationTests.Documents;

public sealed class GuestUnauthorizedTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public GuestUnauthorizedTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetDocuments_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/v1/documents");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetDocumentById_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync($"/api/v1/documents/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
