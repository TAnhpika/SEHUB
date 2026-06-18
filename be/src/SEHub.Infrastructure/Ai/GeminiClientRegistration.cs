using Google.GenAI;
using Google.GenAI.Types;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SEHub.Application.Exams;

namespace SEHub.Infrastructure.Ai;

internal static class GeminiClientRegistration
{
    public static IServiceCollection AddGeminiClient(this IServiceCollection services)
    {
        services.AddSingleton(sp =>
        {
            var settings = sp.GetRequiredService<IOptions<AiTokenLimitSettings>>().Value;
            return new Client(
                apiKey: settings.ApiKey,
                clientOptions: new ClientOptions
                {
                    HttpClientFactory = () => new HttpClient
                    {
                        Timeout = Timeout.InfiniteTimeSpan,
                    },
                });
        });

        return services;
    }
}
