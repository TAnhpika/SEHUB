using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SEHub.Contracts.Common;

namespace SEHub.API.Filters;

public sealed class ApiResponseWrapperFilter : IResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (ShouldSkip(context))
        {
            return;
        }

        if (context.Result is not ObjectResult objectResult)
        {
            return;
        }

        if (objectResult.Value is not null && IsApiResponse(objectResult.Value.GetType()))
        {
            return;
        }

        var isSuccess = objectResult.StatusCode is null or >= 200 and < 300;
        var wrappedType = typeof(ApiResponse<>).MakeGenericType(objectResult.Value?.GetType() ?? typeof(object));
        var wrapped = Activator.CreateInstance(wrappedType);

        wrappedType.GetProperty(nameof(ApiResponse<object>.Success))!.SetValue(wrapped, isSuccess);
        wrappedType.GetProperty(nameof(ApiResponse<object>.Data))!.SetValue(wrapped, objectResult.Value);
        wrappedType.GetProperty(nameof(ApiResponse<object>.Message))!.SetValue(wrapped, null);
        wrappedType.GetProperty(nameof(ApiResponse<object>.Errors))!.SetValue(wrapped, Array.Empty<ApiError>());

        objectResult.Value = wrapped;
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
    }

    private static bool ShouldSkip(ResultExecutingContext context)
    {
        if (context.ActionDescriptor.EndpointMetadata.Any(m => m is SkipApiEnvelopeAttribute))
        {
            return true;
        }

        var path = context.HttpContext.Request.Path.Value ?? string.Empty;
        return path.Equals("/health", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/api/v1/premium/webhooks/payos", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsApiResponse(Type type)
    {
        return type.IsGenericType && type.GetGenericTypeDefinition() == typeof(ApiResponse<>);
    }
}
