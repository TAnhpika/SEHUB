using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using SEHub.Contracts.Common;

namespace SEHub.API.Filters;

public sealed class ApiResponseWrapperFilter : IResultFilter
{
    private const string ValidationMessage = "Dữ liệu không hợp lệ";

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

        if (TryWrapValidationFailure(objectResult))
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

    private static bool TryWrapValidationFailure(ObjectResult objectResult)
    {
        var errors = objectResult.Value switch
        {
            ValidationProblemDetails problemDetails => MapValidationErrors(problemDetails.Errors),
            SerializableError serializableError => MapSerializableError(serializableError),
            _ => null
        };

        if (errors is null || errors.Count == 0)
        {
            return false;
        }

        objectResult.StatusCode = StatusCodes.Status400BadRequest;
        objectResult.Value = new ApiResponse<object?>
        {
            Success = false,
            Data = null,
            Message = ValidationMessage,
            Errors = errors
        };

        return true;
    }

    private static IReadOnlyList<ApiError> MapValidationErrors(
        IDictionary<string, string[]> errors) =>
        errors
            .SelectMany(kvp => kvp.Value.Select(message => new ApiError(NormalizeFieldName(kvp.Key), message)))
            .ToList();

    private static IReadOnlyList<ApiError> MapSerializableError(SerializableError error) =>
        error
            .SelectMany(kvp =>
            {
                return kvp.Value switch
                {
                    string[] messages => messages.Select(message => new ApiError(NormalizeFieldName(kvp.Key), message)),
                    IEnumerable<string> messages => messages.Select(message => new ApiError(NormalizeFieldName(kvp.Key), message)),
                    _ => [new ApiError(NormalizeFieldName(kvp.Key), kvp.Value?.ToString() ?? string.Empty)]
                };
            })
            .ToList();

    private static string NormalizeFieldName(string field)
    {
        if (string.IsNullOrWhiteSpace(field))
        {
            return string.Empty;
        }

        var name = field.Contains('.') ? field.Split('.').Last() : field;
        if (name.Length == 1)
        {
            return name.ToLowerInvariant();
        }

        return char.ToLowerInvariant(name[0]) + name[1..];
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
