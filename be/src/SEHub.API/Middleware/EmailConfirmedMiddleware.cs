using System.Text.Json;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Auth;
using SEHub.Contracts.Common;
using SEHub.Shared.Constants;

namespace SEHub.API.Middleware;

/// <summary>
/// Blocks authenticated API calls when Auth:RequireConfirmedEmail is on and the user
/// has not confirmed email. Allowlisted auth endpoints keep the verify-email session usable.
/// </summary>
public sealed class EmailConfirmedMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// Paths reachable with a JWT even when EmailConfirmed is false.
    /// Refresh is AllowAnonymous (no Bearer) so it is not handled here.
    /// </summary>
    private static readonly HashSet<string> AllowlistedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/v1/auth/me",
        "/api/v1/auth/logout",
        "/api/v1/auth/send-email-verification",
        "/api/v1/auth/verify-email",
    };

    private readonly RequestDelegate _next;

    public EmailConfirmedMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        IUserRepository userRepository,
        IOptions<AuthSettings> authSettings)
    {
        if (authSettings.Value.RequireConfirmedEmail
            && context.User.Identity?.IsAuthenticated == true
            && !IsAllowlisted(context.Request.Path))
        {
            var userIdClaim = context.User.FindFirst("sub")?.Value
                ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdClaim, out var userId))
            {
                var user = await userRepository.GetByIdAsync(userId, context.RequestAborted);
                if (user is not null && !user.EmailConfirmed)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";

                    var response = new ApiResponse<object?>
                    {
                        Success = false,
                        Data = null,
                        Message = "Email chưa được xác thực",
                        Errors = [new ApiError("email", ErrorCodes.EmailNotConfirmed)]
                    };

                    await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
                    return;
                }
            }
        }

        await _next(context);
    }

    private static bool IsAllowlisted(PathString path)
    {
        var value = path.Value;
        if (string.IsNullOrEmpty(value))
        {
            return false;
        }

        if (value.Length > 1 && value.EndsWith('/'))
        {
            value = value.TrimEnd('/');
        }

        return AllowlistedPaths.Contains(value);
    }
}
