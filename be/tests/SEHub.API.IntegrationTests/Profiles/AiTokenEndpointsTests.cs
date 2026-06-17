using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using SEHub.Contracts.Common;
using SEHub.Contracts.Profiles;

namespace SEHub.API.IntegrationTests.Profiles;

public sealed class AiTokenEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AiTokenEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetMyAiTokens_ReturnsDailyQuota_ForAuthenticatedUser()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/v1/profiles/me/ai-tokens");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<AiTokenStatusDto>>();
        body!.Success.Should().BeTrue();
        body.Data!.Limit.Should().Be(10);
        body.Data.Remaining.Should().Be(10);
        body.Data.CostExplain.Should().Be(10);
        body.Data.CanExplain.Should().BeTrue();
    }

    [Fact]
    public async Task GetMyAiTokens_RequiresAuthentication()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.GetAsync("/api/v1/profiles/me/ai-tokens");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
