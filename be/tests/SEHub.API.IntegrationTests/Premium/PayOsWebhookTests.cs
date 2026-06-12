using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Premium;

public sealed class PayOsWebhookTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PayOsWebhookTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PayOsWebhook_WhenPaidTwice_ReturnsOkAndIsIdempotent()
    {
        var payload = new
        {
            code = "00",
            desc = "success",
            data = new
            {
                orderCode = long.Parse(CustomWebApplicationFactory.PayOsOrderCode),
                amount = 48000,
                description = "SEHub Premium",
                reference = CustomWebApplicationFactory.WebhookReference
            },
            signature = "mock-mock-checksum-key-dev"
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var firstResponse = await _client.PostAsync("/api/v1/premium/webhooks/payos", content);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var secondContent = new StringContent(json, Encoding.UTF8, "application/json");
        var secondResponse = await _client.PostAsync("/api/v1/premium/webhooks/payos", secondContent);
        secondResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var order = await context.PaymentOrders
            .SingleAsync(o => o.Id == CustomWebApplicationFactory.PendingPaymentOrderId);
        order.Status.Should().Be(PaymentOrderStatus.Paid);

        var subscriptions = await context.Subscriptions
            .Where(s => s.UserId == CustomWebApplicationFactory.FreeUserId && s.IsActive)
            .ToListAsync();
        subscriptions.Should().HaveCount(1);

        var paidAuditLogs = await context.PaymentAuditLogs
            .Where(l => l.OrderId == CustomWebApplicationFactory.PendingPaymentOrderId && l.Action == "WEBHOOK_PAID")
            .ToListAsync();
        paidAuditLogs.Should().HaveCount(1);

        var emailCapture = _factory.EmailCapture;
        emailCapture.LastPaymentConfirmation.Should().NotBeNull();
        emailCapture.LastPaymentConfirmation!.ToEmail.Should().Be(CustomWebApplicationFactory.FreeUserEmail);
        emailCapture.LastPaymentConfirmation.OrderCode.Should().Be(CustomWebApplicationFactory.PayOsOrderCode);
    }

    [Fact]
    public async Task PayOsWebhook_WhenOrderNotFound_ReturnsOkForUrlVerification()
    {
        var payload = new
        {
            code = "00",
            desc = "success",
            data = new
            {
                orderCode = 1234567890L,
                amount = 48000,
                description = "PayOS URL verification",
                reference = "payos-url-verify-test"
            },
            signature = "mock-mock-checksum-key-dev"
        };

        var json = JsonSerializer.Serialize(payload);
        var response = await _client.PostAsync(
            "/api/v1/premium/webhooks/payos",
            new StringContent(json, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PayOsWebhook_WhenCodeIsNotSuccess_ReturnsOkAndIgnoresPayload()
    {
        var payload = new
        {
            code = "01",
            desc = "pending",
            data = new
            {
                orderCode = long.Parse(CustomWebApplicationFactory.PayOsOrderCode),
                amount = 48000,
                description = "SEHub Premium",
                reference = "payos-pending-ref"
            },
            signature = "mock-mock-checksum-key-dev"
        };

        var json = JsonSerializer.Serialize(payload);
        var response = await _client.PostAsync(
            "/api/v1/premium/webhooks/payos",
            new StringContent(json, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var order = await context.PaymentOrders
            .SingleAsync(o => o.Id == CustomWebApplicationFactory.PendingPaymentOrderId);
        order.Status.Should().Be(PaymentOrderStatus.Pending);
    }
}
