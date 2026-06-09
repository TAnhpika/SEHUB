namespace SEHub.Contracts.Admin;

public sealed class PaymentAuditLogDto
{
    public Guid Id { get; init; }
    public Guid OrderId { get; init; }
    public string Action { get; init; } = string.Empty;
    public Guid? ActorId { get; init; }
    public string? ActorUsername { get; init; }
    public string? PayloadJson { get; init; }
    public DateTime CreatedAt { get; init; }
}
