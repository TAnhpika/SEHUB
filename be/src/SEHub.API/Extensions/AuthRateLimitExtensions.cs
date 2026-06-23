using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SEHub.API.RateLimiting;

namespace SEHub.API.Extensions;

public static class AuthRateLimitExtensions
{
    public static IServiceCollection AddAuthRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = RateLimitResponseWriter.OnRejected;

            options.AddPolicy(AuthRateLimitPolicies.Login, httpContext =>
            {
                var permitLimit = ResolveLoginPermitLimit(httpContext.RequestServices.GetRequiredService<IConfiguration>());
                return RateLimitPartition.GetFixedWindowLimiter(
                    $"login:{ClientIpResolver.Resolve(httpContext)}",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    });
            });

            options.AddPolicy(AuthRateLimitPolicies.GoogleLogin, httpContext =>
            {
                var permitLimit = ResolveGoogleLoginPermitLimit(httpContext.RequestServices.GetRequiredService<IConfiguration>());
                return RateLimitPartition.GetFixedWindowLimiter(
                    $"google-login:{ClientIpResolver.Resolve(httpContext)}",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    });
            });

            options.AddPolicy(AuthRateLimitPolicies.Register, httpContext =>
            {
                var permitLimit = ResolveRegisterPermitLimit(httpContext.RequestServices.GetRequiredService<IConfiguration>());
                return RateLimitPartition.GetFixedWindowLimiter(
                    $"register:{ClientIpResolver.Resolve(httpContext)}",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    });
            });

            options.AddPolicy(AuthRateLimitPolicies.Refresh, httpContext =>
            {
                var permitLimit = ResolveRefreshPermitLimit(httpContext.RequestServices.GetRequiredService<IConfiguration>());
                return RateLimitPartition.GetFixedWindowLimiter(
                    $"refresh:{RefreshRateLimitPartitionResolver.Resolve(httpContext)}",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    });
            });
        });

        return services;
    }

    private static int ResolveLoginPermitLimit(IConfiguration configuration) =>
        ReadPermitLimit(configuration, "RateLimit:LoginPermitLimit", IsRelaxed(configuration) ? 100 : 5);

    private static int ResolveGoogleLoginPermitLimit(IConfiguration configuration) =>
        ReadPermitLimit(configuration, "RateLimit:GoogleLoginPermitLimit", IsRelaxed(configuration) ? 100 : 5);

    private static int ResolveRegisterPermitLimit(IConfiguration configuration) =>
        ReadPermitLimit(configuration, "RateLimit:RegisterPermitLimit", IsRelaxed(configuration) ? 100 : 5);

    private static int ResolveRefreshPermitLimit(IConfiguration configuration) =>
        ReadPermitLimit(configuration, "RateLimit:RefreshPermitLimit", IsRelaxed(configuration) ? 100 : 20);

    private static bool IsRelaxed(IConfiguration configuration) =>
        string.Equals(configuration["Testing:RelaxedRateLimits"], "true", StringComparison.OrdinalIgnoreCase);

    private static int ReadPermitLimit(IConfiguration configuration, string key, int defaultValue)
    {
        var value = configuration[key];
        return int.TryParse(value, out var parsed) ? parsed : defaultValue;
    }
}
