using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Ai;

public sealed class AiInfrastructureRegistration
{
    public static bool ShouldUseGemini(Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        var provider = configuration[$"{Application.Exams.AiTokenLimitSettings.SectionName}:Provider"] ?? "Mock";
        var apiKey = configuration[$"{Application.Exams.AiTokenLimitSettings.SectionName}:ApiKey"] ?? string.Empty;

        return provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(apiKey);
    }
}
