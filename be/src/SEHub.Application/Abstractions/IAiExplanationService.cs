namespace SEHub.Application.Abstractions;

public interface IAiExplanationService
{
    Task<AiExplanationResult> ExplainAsync(Guid questionId, string questionContent, string? context, CancellationToken cancellationToken = default);
}

public sealed class AiExplanationResult
{
    public string Explanation { get; init; } = string.Empty;
    public int TokensUsed { get; init; }
}
