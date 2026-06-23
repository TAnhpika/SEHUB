namespace SEHub.Contracts.Exams;

public sealed class AiExplainResponse
{
    public string Explanation { get; init; } = string.Empty;
    public int TokensUsed { get; init; }
    public int RemainingTokens { get; init; }
}
