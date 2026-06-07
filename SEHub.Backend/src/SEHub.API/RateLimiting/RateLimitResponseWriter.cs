using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using SEHub.Contracts.Common;
using SEHub.Shared.Constants;

namespace SEHub.API.RateLimiting;

public static class RateLimitResponseWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static ValueTask OnRejected(OnRejectedContext context, CancellationToken cancellationToken)
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
        }

        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";

        var response = new ApiResponse<object?>
        {
            Success = false,
            Data = null,
            Message = "Too many requests. Please try again later.",
            Errors = [new ApiError("rateLimit", ErrorCodes.AuthRateLimitExceeded)]
        };

        return new ValueTask(context.HttpContext.Response.WriteAsync(
            JsonSerializer.Serialize(response, JsonOptions),
            cancellationToken));
    }
}
