using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Premium;

public sealed class N8nPremiumActivationEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private const string ActivateEndpoint = "/api/v1/premium/activate";
    private const string SecretHeaderName = "X-SEHUB-SECRET-KEY";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public N8nPremiumActivationEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ActivateFromN8n_WhenSecretHeaderMissing_ReturnsUnauthorized()
    {
        using var content = CreateRequestContent();

        var response = await _client.PostAsync(ActivateEndpoint, content);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ActivateFromN8n_WhenSecretHeaderInvalid_ReturnsUnauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, ActivateEndpoint)
        {
            Content = CreateRequestContent(),
        };
        request.Headers.TryAddWithoutValidation(SecretHeaderName, "wrong-secret");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ActivateFromN8n_WhenSecretHeaderValid_ReturnsOkAndActivatesPremium()
    {
        using var request = CreateAuthorizedRequest();

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);

        document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();

        var data = document.RootElement.GetProperty("data");
        data.GetProperty("username").GetString().Should().Be("freeuser");
        data.GetProperty("isPremium").GetBoolean().Should().BeTrue();
        data.GetProperty("orderCode").GetString().Should().Be(CustomWebApplicationFactory.PayOsOrderCode);
        data.GetProperty("alreadyProcessed").GetBoolean().Should().BeFalse();
        data.GetProperty("aiDailyTokenLimit").GetInt32().Should().BeGreaterThan(0);

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var order = await context.PaymentOrders
            .SingleAsync(o => o.Id == CustomWebApplicationFactory.PendingPaymentOrderId);
        order.Status.Should().Be(PaymentOrderStatus.Paid);

        var subscriptions = await context.Subscriptions
            .Where(s => s.UserId == CustomWebApplicationFactory.FreeUserId && s.IsActive)
            .ToListAsync();
        subscriptions.Should().HaveCount(1);

        var auditLogs = await context.PaymentAuditLogs
            .Where(l => l.OrderId == CustomWebApplicationFactory.PendingPaymentOrderId && l.Action == "N8N_ACTIVATE")
            .ToListAsync();
        auditLogs.Should().HaveCount(1);
    }

    private static HttpRequestMessage CreateAuthorizedRequest()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, ActivateEndpoint)
        {
            Content = CreateRequestContent(),
        };
        request.Headers.TryAddWithoutValidation(SecretHeaderName, CustomWebApplicationFactory.N8nInboundSecretKey);
        return request;
    }

    private static StringContent CreateRequestContent()
    {
        var payload = JsonSerializer.Serialize(new
        {
            orderCode = CustomWebApplicationFactory.PayOsOrderCode,
            amount = 48000,
            packageName = "Gói 1 tháng",
            username = "freeuser",
        });

        return new StringContent(payload, Encoding.UTF8, "application/json");
    }
}
