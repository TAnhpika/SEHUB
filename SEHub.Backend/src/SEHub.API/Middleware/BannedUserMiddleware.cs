using System.Text.Json;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Shared.Constants;

namespace SEHub.API.Middleware;

public sealed class BannedUserMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;

    public BannedUserMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IUserRepository userRepository)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirst("sub")?.Value
                ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdClaim, out var userId)
                && await userRepository.IsCurrentlyBannedAsync(userId, context.RequestAborted))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";

                var response = new ApiResponse<object?>
                {
                    Success = false,
                    Data = null,
                    Message = "Tài khoản đã bị khóa",
                    Errors = [new ApiError("account", ErrorCodes.AccountBanned)]
                };

                await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
                return;
            }
        }

        await _next(context);
    }
}
