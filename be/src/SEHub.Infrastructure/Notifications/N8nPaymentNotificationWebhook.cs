using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Contracts.Premium;

namespace SEHub.Infrastructure.Notifications;

public sealed class N8nPaymentNotificationWebhook : IPaymentNotificationWebhook
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _httpClient;
    private readonly N8nSettings _settings;
    private readonly ILogger<N8nPaymentNotificationWebhook> _logger;

    public N8nPaymentNotificationWebhook(
        HttpClient httpClient,
        IOptions<N8nSettings> settings,
        ILogger<N8nPaymentNotificationWebhook> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task NotifyPaymentPaidAsync(
        PaymentPaidNotification notification,
        CancellationToken cancellationToken = default)
    {
        if (!_settings.Enabled || string.IsNullOrWhiteSpace(_settings.WebhookUrl))
        {
            return;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, _settings.WebhookUrl)
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
                    "n8n payment webhook returned {StatusCode}: {Body}",
                    (int)response.StatusCode,
                    body);
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "n8n payment webhook call failed for order {OrderId}", notification.OrderId);
        }
    }
}
