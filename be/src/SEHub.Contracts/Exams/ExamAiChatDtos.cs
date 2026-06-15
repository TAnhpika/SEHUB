namespace SEHub.Contracts.Exams;

public sealed class ExamAiChatRequest
{
    public string Message { get; init; } = string.Empty;
}

public sealed class ExamAiChatMessageDto
{
    public Guid Id { get; init; }
    public string Role { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}

public sealed class ExamAiChatResponse
{
    public Guid ThreadId { get; init; }
    public string Reply { get; init; } = string.Empty;
    public int TokensUsed { get; init; }
    public int RemainingTokens { get; init; }
    public IReadOnlyList<ExamAiChatMessageDto> Messages { get; init; } = Array.Empty<ExamAiChatMessageDto>();
}
