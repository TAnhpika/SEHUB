using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Exams;

namespace SEHub.Infrastructure.Ai;

public sealed class GeminiAiExplanationService : IAiExplanationService
{
    private readonly IAiProvider _aiProvider;
    private readonly AiTokenLimitSettings _settings;

    public GeminiAiExplanationService(IAiProvider aiProvider, IOptions<AiTokenLimitSettings> settings)
    {
        _aiProvider = aiProvider;
        _settings = settings.Value;
    }

    public async Task<AiExplanationResult> ExplainAsync(
        Guid questionId,
        string questionContent,
        string? context,
        CancellationToken cancellationToken = default)
    {
        var systemInstruction =
            "Bạn là trợ giảng SEHub cho sinh viên FPT. Giải thích câu hỏi trắc nghiệm bằng tiếng Việt, " +
            "rõ ràng, có cấu trúc (tóm tắt, phân tích từng đáp án nếu có, kết luận). " +
            "Không bịa đáp án nếu thiếu thông tin.";

        var userPrompt =
            $"QuestionId: {questionId}\n" +
            $"Câu hỏi:\n{questionContent.Trim()}\n" +
            (string.IsNullOrWhiteSpace(context) ? string.Empty : $"\nNgữ cảnh thêm:\n{context.Trim()}");

        var result = await _aiProvider.CompleteAsync(
            new AiProviderRequest
            {
                SystemInstruction = systemInstruction,
                Messages =
                [
                    new AiProviderMessage { Role = "user", Text = userPrompt },
                ],
            },
            cancellationToken);

        return new AiExplanationResult
        {
            Explanation = result.Text,
            TokensUsed = _settings.TokenCostExplain,
        };
    }
}
