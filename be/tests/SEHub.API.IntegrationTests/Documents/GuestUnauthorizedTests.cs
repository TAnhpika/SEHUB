using System.Net;
using System.Net.Http.Json;
using SEHub.Contracts.Common;
using SEHub.Contracts.Documents;

namespace SEHub.API.IntegrationTests.Documents;

public sealed class GuestUnauthorizedTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public GuestUnauthorizedTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetDocuments_WithoutToken_ReturnsCatalogList()
    {
        var response = await _client.GetAsync("/api/v1/documents?pageSize=10");

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<PagedResult<DocumentListItemDto>>>();
        body.Should().NotBeNull();
        body!.Data.Should().NotBeNull();
        body.Data!.Items.Should().NotBeNull();
    }

    [Fact]
    public async Task GetDocumentById_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync($"/api/v1/documents/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetDocumentPreview_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync($"/api/v1/documents/{Guid.NewGuid()}/preview?page=1");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetDocumentContent_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync($"/api/v1/documents/{Guid.NewGuid()}/content");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
