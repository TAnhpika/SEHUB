using System.Net;
using System.Text.Json;
using FluentValidation;
using SEHub.Contracts.Common;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.API.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = MapException(exception);

        if (statusCode >= (int)HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        if (ShouldUsePlainResponse(context.Request.Path))
        {
            await context.Response.WriteAsync(string.Empty);
            return;
        }

        var response = new ApiResponse<object?>
        {
            Success = false,
            Data = null,
            Message = message,
            Errors = errors
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }

    private static (int StatusCode, string Message, IReadOnlyList<ApiError> Errors) MapException(Exception exception)
    {
        return exception switch
        {
            ValidationException validation => (
                StatusCodes.Status400BadRequest,
                "Dữ liệu không hợp lệ",
                validation.Errors
                    .Select(e => new ApiError(e.PropertyName, e.ErrorMessage))
                    .ToList()),

            ForbiddenException forbidden => MapForbidden(forbidden),

            NotFoundException notFound => (
                StatusCodes.Status404NotFound,
                notFound.Message,
                [new ApiError(string.Empty, ErrorCodes.NotFound)]),

            ConflictException conflict => (
                StatusCodes.Status409Conflict,
                conflict.Message,
                [new ApiError(string.Empty, conflict.Message)]),

            DomainException domain => (
                StatusCodes.Status400BadRequest,
                domain.Message,
                [new ApiError(string.Empty, domain.Message)]),

            EmailDeliveryException emailDelivery => (
                StatusCodes.Status503ServiceUnavailable,
                emailDelivery.Message,
                [new ApiError("email", ErrorCodes.EmailDeliveryFailed)]),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Đã xảy ra lỗi hệ thống",
                [new ApiError(string.Empty, "INTERNAL_ERROR")])
        };
    }

    private static (int StatusCode, string Message, IReadOnlyList<ApiError> Errors) MapForbidden(ForbiddenException exception)
    {
        var code = exception.Message;

        if (code == ErrorCodes.TokenLimitExceeded)
        {
            return (
                StatusCodes.Status429TooManyRequests,
                "Đã vượt quá giới hạn token AI trong ngày",
                [new ApiError("ai", ErrorCodes.TokenLimitExceeded)]);
        }

        if (code == ErrorCodes.AccountBanned)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Tài khoản đã bị khóa",
                [new ApiError("account", ErrorCodes.AccountBanned)]);
        }

        if (code == ErrorCodes.PremiumRequired)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Tính năng yêu cầu gói Premium",
                [new ApiError("subscription", ErrorCodes.PremiumRequired)]);
        }

        if (code == ErrorCodes.EmailNotConfirmed)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Email chưa được xác thực",
                [new ApiError("email", ErrorCodes.EmailNotConfirmed)]);
        }

        if (code == ErrorCodes.OtpInvalid)
        {
            return (
                StatusCodes.Status400BadRequest,
                "Mã OTP không hợp lệ hoặc đã hết hạn",
                [new ApiError("otp", ErrorCodes.OtpInvalid)]);
        }

        if (code == ErrorCodes.OtpCooldown)
        {
            return (
                StatusCodes.Status429TooManyRequests,
                "Vui lòng đợi trước khi gửi lại OTP",
                [new ApiError("otp", ErrorCodes.OtpCooldown)]);
        }

        if (code == ErrorCodes.OtpRateLimitExceeded)
        {
            return (
                StatusCodes.Status429TooManyRequests,
                "Đã vượt quá số lần yêu cầu OTP trong giờ",
                [new ApiError("otp", ErrorCodes.OtpRateLimitExceeded)]);
        }

        if (code == ErrorCodes.OtpMaxAttempts)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Đã vượt quá số lần nhập OTP",
                [new ApiError("otp", ErrorCodes.OtpMaxAttempts)]);
        }

        if (code == ErrorCodes.GoogleTokenInvalid)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Google token không hợp lệ hoặc đã hết hạn",
                [new ApiError("google", ErrorCodes.GoogleTokenInvalid)]);
        }

        return (
            StatusCodes.Status403Forbidden,
            exception.Message,
            [new ApiError(string.Empty, ErrorCodes.Forbidden)]);
    }

    private static bool ShouldUsePlainResponse(PathString path)
    {
        var value = path.Value ?? string.Empty;
        return value.Equals("/health", StringComparison.OrdinalIgnoreCase)
            || value.Equals("/api/v1/premium/webhooks/payos", StringComparison.OrdinalIgnoreCase);
    }
}
