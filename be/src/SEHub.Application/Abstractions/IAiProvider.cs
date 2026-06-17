namespace SEHub.Application.Abstractions;

public interface IAiProvider
{
    Task<AiProviderResult> CompleteAsync(AiProviderRequest request, CancellationToken cancellationToken = default);
}

public sealed class AiProviderRequest
{
    public string SystemInstruction { get; init; } = string.Empty;
    public IReadOnlyList<AiProviderMessage> Messages { get; init; } = Array.Empty<AiProviderMessage>();
}

public sealed class AiProviderMessage
{
    public string Role { get; init; } = "user";
    public string Text { get; init; } = string.Empty;
}

public sealed class AiProviderResult
{
    public string Text { get; init; } = string.Empty;
    public int EstimatedTokensUsed { get; init; }
}
