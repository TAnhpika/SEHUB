using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;

namespace SEHub.API.IntegrationTests.Premium;

public sealed class PremiumRefundEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private const string RefundEndpoint = "/api/v1/premium/refund";

    public static readonly Guid RecentPaidOrderId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    public const string RecentPaidOrderCode = "1111222233";

    public static readonly Guid ExpiredPaidOrderId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    public const string ExpiredPaidOrderCode = "3333444455";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PremiumRefundEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RequestRefund_WithoutToken_ReturnsUnauthorized()
    {
        using var content = CreateRefundContent(RecentPaidOrderCode, "Changed my mind");

        var response = await _client.PostAsync(RefundEndpoint, content);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RequestRefund_WhenPaymentOlderThan24Hours_ReturnsBadRequest()
    {
        await SeedExpiredPaidOrderAsync();

        var token = await _factory.LoginAndGetTokenAsync(_client);
        using var request = CreateAuthorizedRefundRequest(token, ExpiredPaidOrderCode, "Too late refund");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);
        document.RootElement.GetProperty("message").GetString()
            .Should().Be("Đã quá hạn 24 giờ kể từ lúc thanh toán, không thể hoàn tiền.");
    }

    [Fact]
    public async Task RequestRefund_WhenWithin24Hours_ReturnsOkAndKeepsPremiumUntilAdminApproves()
    {
        await SeedRecentPaidOrderWithPremiumAsync(tokensConsumed: 500);

        var token = await _factory.LoginAndGetTokenAsync(_client);
        using var request = CreateAuthorizedRefundRequest(token, RecentPaidOrderCode, "Accidental purchase");

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(stream);

        document.RootElement.GetProperty("success").GetBoolean().Should().BeTrue();

        var data = document.RootElement.GetProperty("data");
        data.GetProperty("orderCode").GetString().Should().Be(RecentPaidOrderCode);
        data.GetProperty("status").GetString().Should().Be(nameof(PaymentOrderStatus.RefundRequested));
        data.GetProperty("isPremium").GetBoolean().Should().BeTrue();
        data.GetProperty("aiDailyTokenLimit").GetInt32().Should().Be(1000);

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var order = await context.PaymentOrders.SingleAsync(o => o.Id == RecentPaidOrderId);
        order.Status.Should().Be(PaymentOrderStatus.RefundRequested);

        var activeSubscriptions = await context.Subscriptions
            .Where(s => s.UserId == CustomWebApplicationFactory.FreeUserId && s.IsActive)
            .ToListAsync();
        activeSubscriptions.Should().HaveCount(1);

        var refundAudit = await context.PaymentAuditLogs
            .Where(l => l.OrderId == RecentPaidOrderId && l.Action == "REFUND_REQUEST")
            .SingleAsync();
        refundAudit.PayloadJson.Should().Contain("Accidental purchase");

        var tokenUsage = await context.AiTokenDailyUsages
            .SingleAsync(u => u.UserId == CustomWebApplicationFactory.FreeUserId);
        tokenUsage.TokensConsumed.Should().Be(500);
    }

    private static StringContent CreateRefundContent(string orderCode, string reason)
    {
        var payload = JsonSerializer.Serialize(new
        {
            orderCode,
            reason,
        });

        return new StringContent(payload, Encoding.UTF8, "application/json");
    }

    private static HttpRequestMessage CreateAuthorizedRefundRequest(string token, string orderCode, string reason)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, RefundEndpoint)
        {
            Content = CreateRefundContent(orderCode, reason),
        };
        request.Headers.TryAddWithoutValidation("Authorization", $"Bearer {token}");
        return request;
    }

    private async Task SeedExpiredPaidOrderAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var existing = await context.PaymentOrders
            .Include(o => o.AuditLogs)
            .FirstOrDefaultAsync(o => o.Id == ExpiredPaidOrderId);

        if (existing is not null)
        {
            context.PaymentAuditLogs.RemoveRange(existing.AuditLogs);
            context.PaymentOrders.Remove(existing);
            await context.SaveChangesAsync();
        }

        var paidAt = DateTime.UtcNow.AddHours(-25);

        context.PaymentOrders.Add(new PaymentOrder
        {
            Id = ExpiredPaidOrderId,
            UserId = CustomWebApplicationFactory.FreeUserId,
            PlanId = CustomWebApplicationFactory.SubscriptionPlanId,
            PayOsOrderCode = ExpiredPaidOrderCode,
            Amount = 48000,
            Status = PaymentOrderStatus.Paid,
            ExpiredAt = paidAt.AddMinutes(15),
            CreatedAt = paidAt,
            UpdatedAt = paidAt,
        });

        context.PaymentAuditLogs.Add(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = ExpiredPaidOrderId,
            Action = "WEBHOOK_PAID",
            PayloadJson = "{}",
            CreatedAt = paidAt,
        });

        await context.SaveChangesAsync();
    }

    private async Task SeedRecentPaidOrderWithPremiumAsync(int tokensConsumed)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();

        var existingOrder = await context.PaymentOrders
            .Include(o => o.AuditLogs)
            .FirstOrDefaultAsync(o => o.Id == RecentPaidOrderId);

        if (existingOrder is not null)
        {
            context.PaymentAuditLogs.RemoveRange(existingOrder.AuditLogs);
            context.PaymentOrders.Remove(existingOrder);
        }

        var existingSubscriptions = await context.Subscriptions
            .Where(s => s.UserId == CustomWebApplicationFactory.FreeUserId)
            .ToListAsync();
        context.Subscriptions.RemoveRange(existingSubscriptions);

        var existingUsage = await context.AiTokenDailyUsages
            .Where(u => u.UserId == CustomWebApplicationFactory.FreeUserId)
            .ToListAsync();
        context.AiTokenDailyUsages.RemoveRange(existingUsage);

        var paidAt = DateTime.UtcNow.AddHours(-2);

        context.PaymentOrders.Add(new PaymentOrder
        {
            Id = RecentPaidOrderId,
            UserId = CustomWebApplicationFactory.FreeUserId,
            PlanId = CustomWebApplicationFactory.SubscriptionPlanId,
            PayOsOrderCode = RecentPaidOrderCode,
            Amount = 48000,
            Status = PaymentOrderStatus.Paid,
            ExpiredAt = paidAt.AddMinutes(15),
            CreatedAt = paidAt,
            UpdatedAt = paidAt,
        });

        context.PaymentAuditLogs.Add(new PaymentAuditLog
        {
            Id = Guid.NewGuid(),
            OrderId = RecentPaidOrderId,
            Action = "WEBHOOK_PAID",
            PayloadJson = "{}",
            CreatedAt = paidAt,
        });

        context.Subscriptions.Add(new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = CustomWebApplicationFactory.FreeUserId,
            PlanId = CustomWebApplicationFactory.SubscriptionPlanId,
            StartAt = paidAt,
            EndAt = paidAt.AddDays(30),
            IsActive = true,
            CreatedAt = paidAt,
        });

        context.AiTokenDailyUsages.Add(new AiTokenDailyUsage
        {
            Id = Guid.NewGuid(),
            UserId = CustomWebApplicationFactory.FreeUserId,
            UsageDate = DateOnly.FromDateTime(DateTime.UtcNow),
            TokensConsumed = tokensConsumed,
            CreatedAt = DateTime.UtcNow,
        });

        await context.SaveChangesAsync();
    }
}
