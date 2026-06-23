namespace SEHub.Infrastructure.Notifications;

public sealed class N8nSettings
{
    public const string SectionName = "N8n";

    public bool Enabled { get; set; }

    public string WebhookUrl { get; set; } = string.Empty;

    public string RefundWebhookUrl { get; set; } = string.Empty;

    public string? WebhookSecret { get; set; }

    public string? InboundSecretKey { get; set; }

    public int TimeoutSeconds { get; set; } = 10;
}
