using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SEHub.Contracts.Premium;
using SEHub.Infrastructure.Notifications;

namespace SEHub.Application.UnitTests.Notifications;

public sealed class N8nPaymentNotificationWebhookTests
{
    [Fact]
    public async Task NotifyPaymentPaidAsync_WhenDisabled_DoesNotCallHttp()
    {
        var handler = new RecordingHandler();
        var httpClient = new HttpClient(handler);
        var sut = CreateSut(httpClient, enabled: false, webhookUrl: "https://n8n.example/webhook/payment");

        await sut.NotifyPaymentPaidAsync(CreateNotification());

        handler.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task NotifyPaymentPaidAsync_WhenEnabled_PostsJsonToWebhook()
    {
        var handler = new RecordingHandler();
        var httpClient = new HttpClient(handler);
        var sut = CreateSut(
            httpClient,
            enabled: true,
            webhookUrl: "https://n8n.example/webhook/payment",
            webhookSecret: "test-secret");

        await sut.NotifyPaymentPaidAsync(CreateNotification());

        handler.CallCount.Should().Be(1);
        handler.LastRequest!.Method.Should().Be(HttpMethod.Post);
        handler.LastRequest.RequestUri!.ToString().Should().Be("https://n8n.example/webhook/payment");
        handler.LastRequest.Headers.GetValues("X-SEHUB-Webhook-Secret").Single().Should().Be("test-secret");
    }

    [Fact]
    public async Task NotifyPaymentPaidAsync_WhenHttpFails_DoesNotThrow()
    {
        var handler = new RecordingHandler(HttpStatusCode.InternalServerError);
        var httpClient = new HttpClient(handler);
        var sut = CreateSut(httpClient, enabled: true, webhookUrl: "https://n8n.example/webhook/payment");

        var act = () => sut.NotifyPaymentPaidAsync(CreateNotification());

        await act.Should().NotThrowAsync();
    }

    private static N8nPaymentNotificationWebhook CreateSut(
        HttpClient httpClient,
        bool enabled,
        string webhookUrl,
        string? webhookSecret = null)
    {
        return new N8nPaymentNotificationWebhook(
            httpClient,
            Options.Create(new N8nSettings
            {
                Enabled = enabled,
                WebhookUrl = webhookUrl,
                WebhookSecret = webhookSecret,
                TimeoutSeconds = 10,
            }),
            NullLogger<N8nPaymentNotificationWebhook>.Instance);
    }

    private static PaymentPaidNotification CreateNotification() => new()
    {
        UserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        UserEmail = "student@sehub.local",
        DisplayName = "Student",
        OrderId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        PayOsOrderCode = "123456",
        PlanId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        PlanName = "1 tháng",
        AmountVnd = 48000,
        PaidAt = DateTime.UtcNow,
        ExpiresAt = DateTime.UtcNow.AddDays(30),
    };

    private sealed class RecordingHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _statusCode;

        public RecordingHandler(HttpStatusCode statusCode = HttpStatusCode.OK)
        {
            _statusCode = statusCode;
        }

        public int CallCount { get; private set; }

        public HttpRequestMessage? LastRequest { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            CallCount++;
            LastRequest = request;
            return Task.FromResult(new HttpResponseMessage(_statusCode));
        }
    }
}
