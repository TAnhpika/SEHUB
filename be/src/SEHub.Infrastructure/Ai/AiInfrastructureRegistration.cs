using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Ai;

public sealed class AiInfrastructureRegistration
{
    public static bool ShouldUseOpenRouter(Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        var provider = configuration[$"{Application.Exams.AiTokenLimitSettings.SectionName}:Provider"] ?? "Mock";
        var apiKey = configuration[$"{Application.Exams.AiTokenLimitSettings.SectionName}:ApiKey"] ?? string.Empty;

        return provider.Equals("OpenRouter", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(apiKey);
    }
}
