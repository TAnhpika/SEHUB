using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SEHub.Application.Exams;

namespace SEHub.Infrastructure.Ai;

internal static class OpenRouterClientRegistration
{
    public static IServiceCollection AddOpenRouterClient(this IServiceCollection services)
    {
        services.AddHttpClient(OpenRouterAiProvider.HttpClientName, (sp, client) =>
        {
            var settings = sp.GetRequiredService<IOptions<AiTokenLimitSettings>>().Value;
            var baseUrl = string.IsNullOrWhiteSpace(settings.BaseUrl)
                ? "https://openrouter.ai/api/v1/"
                : settings.BaseUrl.Trim();

            if (!baseUrl.EndsWith('/'))
            {
                baseUrl += "/";
            }

            client.BaseAddress = new Uri(baseUrl);
            var timeoutSeconds = Math.Clamp(settings.RequestTimeoutSeconds, 30, 300);
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds + 15);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });

        return services;
    }
}
