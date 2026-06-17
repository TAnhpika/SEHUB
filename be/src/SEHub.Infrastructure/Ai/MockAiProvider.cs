using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Ai;

public sealed class MockAiProvider : IAiProvider
{
    public Task<AiProviderResult> CompleteAsync(AiProviderRequest request, CancellationToken cancellationToken = default)
    {
        var lastUserMessage = request.Messages.LastOrDefault()?.Text ?? string.Empty;
        var reply =
            "[Mock AI Chat] SEHub trả lời demo. " +
            $"Câu hỏi của bạn: \"{lastUserMessage.Trim()}\". " +
            "Khi bật Gemini provider, phản hồi sẽ được tạo bởi Gemini Flash.";

        return Task.FromResult(new AiProviderResult
        {
            Text = reply,
            EstimatedTokensUsed = 10,
        });
    }
}
