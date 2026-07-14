using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Exams;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Ai;

public sealed class OpenRouterAiExplanationService : IAiExplanationService
{
    private readonly IAiProvider _aiProvider;
    private readonly AiTokenLimitSettings _settings;

    public OpenRouterAiExplanationService(IAiProvider aiProvider, IOptions<AiTokenLimitSettings> settings)
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
            "Viết ngắn gọn (khoảng 180–280 từ), đủ ý nhưng không dài dòng. " +
            "Luôn kết thúc bằng một câu kết luận hoàn chỉnh; không dừng giữa từ hoặc giữa câu. " +
            "Không bịa đáp án nếu thiếu thông tin. " +
            AiPromptRules.PlainTextOnly;

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
