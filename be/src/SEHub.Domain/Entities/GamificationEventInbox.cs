namespace SEHub.Domain.Entities;

public class GamificationEventInbox
{
    public string IdempotencyKey { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; }
    public string Result { get; set; } = string.Empty;
}
