namespace SEHub.Application.Models;

public sealed class GoogleTokenPayload
{
    public string Subject { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool EmailVerified { get; init; }
}
