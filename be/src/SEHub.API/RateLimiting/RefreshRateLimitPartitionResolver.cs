using System.Security.Claims;
using System.Text.Json;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Auth;

namespace SEHub.API.RateLimiting;

public static class RefreshRateLimitPartitionResolver
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static string Resolve(HttpContext httpContext)
    {
        var ip = ClientIpResolver.Resolve(httpContext);

        if (httpContext.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContext.User.FindFirst("sub")?.Value;

            if (Guid.TryParse(userIdClaim, out var authenticatedUserId))
            {
                return $"user:{authenticatedUserId}";
            }
        }

        var refreshToken = TryReadRefreshToken(httpContext);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return $"ip:{ip}";
        }

        try
        {
            var repository = httpContext.RequestServices.GetRequiredService<IRefreshTokenRepository>();
            var stored = repository
                .FindByTokenValueAsync(refreshToken, httpContext.RequestAborted)
                .GetAwaiter()
                .GetResult();

            if (stored is not null)
            {
                return $"user:{stored.UserId}";
            }
        }
        catch
        {
            // Fall back to IP partitioning when lookup fails.
        }

        return $"ip:{ip}";
    }

    private static string? TryReadRefreshToken(HttpContext httpContext)
    {
        if (!httpContext.Request.Body.CanSeek)
        {
            httpContext.Request.EnableBuffering();
        }

        try
        {
            httpContext.Request.Body.Position = 0;
            using var reader = new StreamReader(httpContext.Request.Body, leaveOpen: true);
            var body = reader.ReadToEndAsync().GetAwaiter().GetResult();
            httpContext.Request.Body.Position = 0;

            if (string.IsNullOrWhiteSpace(body))
            {
                return null;
            }

            var request = JsonSerializer.Deserialize<RefreshTokenRequest>(body, JsonOptions);
            return string.IsNullOrWhiteSpace(request?.RefreshToken) ? null : request.RefreshToken;
        }
        catch
        {
            httpContext.Request.Body.Position = 0;
            return null;
        }
    }
}
