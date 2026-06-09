using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Ai;

public class MockAiExplanationService : IAiExplanationService
{
    public Task<AiExplanationResult> ExplainAsync(
        Guid questionId, string questionContent, string? context,
        CancellationToken cancellationToken = default)
    {
        var explanation =
            $"[Mock AI Explanation] Question {questionId:N}: " +
            "This is a development mock response. In production, OpenAI would analyze the question and provide a detailed explanation.";

        return Task.FromResult(new AiExplanationResult
        {
            Explanation = explanation,
            TokensUsed = 150
        });
    }
}
