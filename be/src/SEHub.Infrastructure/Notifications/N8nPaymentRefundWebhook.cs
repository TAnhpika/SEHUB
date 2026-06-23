using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Contracts.Premium;

namespace SEHub.Infrastructure.Notifications;

public sealed class N8nPaymentRefundWebhook : IPaymentRefundNotificationWebhook
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _httpClient;
    private readonly N8nSettings _settings;
    private readonly ILogger<N8nPaymentRefundWebhook> _logger;

    public N8nPaymentRefundWebhook(
        HttpClient httpClient,
        IOptions<N8nSettings> settings,
        ILogger<N8nPaymentRefundWebhook> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task NotifyRefundRequestedAsync(
        PremiumRefundNotification notification,
        CancellationToken cancellationToken = default)
    {
        if (!_settings.Enabled || string.IsNullOrWhiteSpace(_settings.RefundWebhookUrl))
        {
            return;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, _settings.RefundWebhookUrl)
        {
            Content = JsonContent.Create(notification, options: JsonOptions),
        };

        if (!string.IsNullOrWhiteSpace(_settings.WebhookSecret))
        {
            request.Headers.TryAddWithoutValidation("X-SEHUB-Webhook-Secret", _settings.WebhookSecret);
        }

        try
        {
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
                    "n8n refund webhook returned {StatusCode}: {Body}",
                    (int)response.StatusCode,
                    body);
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "n8n refund webhook call failed for order {OrderCode}", notification.OrderCode);
        }
    }
}
