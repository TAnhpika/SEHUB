using System.Net;
using System.Text.Json;
using FluentValidation;
using SEHub.Contracts.Common;
using SEHub.Application.Auth;
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
        var (statusCode, message, errors, data) = MapException(exception);

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
            Data = data,
            Message = message,
            Errors = errors
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }

    private static (int StatusCode, string Message, IReadOnlyList<ApiError> Errors, object? Data) MapException(Exception exception)
    {
        return exception switch
        {
            ValidationException validation => (
                StatusCodes.Status400BadRequest,
                "Dữ liệu không hợp lệ",
                validation.Errors
                    .Select(e => new ApiError(e.PropertyName, e.ErrorMessage))
                    .ToList(),
                null),

            AccountBannedException banned => (
                StatusCodes.Status403Forbidden,
                "Tài khoản đã bị khóa",
                [new ApiError("account", ErrorCodes.AccountBanned)],
                banned.Penalty),

            ForbiddenException forbidden => MapForbidden(forbidden),

            NotFoundException notFound => (
                StatusCodes.Status404NotFound,
                notFound.Message,
                [new ApiError(string.Empty, ErrorCodes.NotFound)],
                null),

            ConflictException conflict => (
                StatusCodes.Status409Conflict,
                conflict.Message,
                [new ApiError(string.Empty, conflict.Message)],
                null),

            AiProviderException aiProvider => (
                StatusCodes.Status503ServiceUnavailable,
                aiProvider.Message,
                [new ApiError("ai", ErrorCodes.AiProviderUnavailable)],
                null),

            DomainException domain => (
                StatusCodes.Status400BadRequest,
                domain.Message,
                [new ApiError(string.Empty, domain.Message)],
                null),

            EmailDeliveryException emailDelivery => (
                StatusCodes.Status503ServiceUnavailable,
                emailDelivery.Message,
                [new ApiError("email", ErrorCodes.EmailDeliveryFailed)],
                null),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Đã xảy ra lỗi hệ thống",
                [new ApiError(string.Empty, "INTERNAL_ERROR")],
                null)
        };
    }

    private static (int StatusCode, string Message, IReadOnlyList<ApiError> Errors, object? Data) MapForbidden(ForbiddenException exception)
    {
        var code = exception.Message;

        if (code == ErrorCodes.TokenLimitExceeded)
        {
            return (
                StatusCodes.Status429TooManyRequests,
                "Đã vượt quá giới hạn token AI trong ngày",
                [new ApiError("ai", ErrorCodes.TokenLimitExceeded)],
                null);
        }

        if (code == ErrorCodes.AccountBanned)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Tài khoản đã bị khóa",
                [new ApiError("account", ErrorCodes.AccountBanned)],
                null);
        }

        if (code == ErrorCodes.PremiumRequired)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Tính năng yêu cầu gói Premium",
                [new ApiError("subscription", ErrorCodes.PremiumRequired)],
                null);
        }

        if (code == ErrorCodes.EmailNotConfirmed)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Email chưa được xác thực",
                [new ApiError("email", ErrorCodes.EmailNotConfirmed)],
                null);
        }

        if (code == ErrorCodes.OtpInvalid)
        {
            return (
                StatusCodes.Status400BadRequest,
                "Mã OTP không hợp lệ hoặc đã hết hạn",
                [new ApiError("otp", ErrorCodes.OtpInvalid)],
                null);
        }

        if (code == ErrorCodes.OtpCooldown)
        {
            return (
                StatusCodes.Status429TooManyRequests,
                "Vui lòng đợi trước khi gửi lại OTP",
                [new ApiError("otp", ErrorCodes.OtpCooldown)],
                null);
        }

        if (code == ErrorCodes.OtpRateLimitExceeded)
        {
            return (
                StatusCodes.Status429TooManyRequests,
                "Đã vượt quá số lần yêu cầu OTP trong giờ",
                [new ApiError("otp", ErrorCodes.OtpRateLimitExceeded)],
                null);
        }

        if (code == ErrorCodes.OtpMaxAttempts)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Đã vượt quá số lần nhập OTP",
                [new ApiError("otp", ErrorCodes.OtpMaxAttempts)],
                null);
        }

        if (code == ErrorCodes.GoogleTokenInvalid)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Google token không hợp lệ hoặc đã hết hạn",
                [new ApiError("google", ErrorCodes.GoogleTokenInvalid)],
                null);
        }

        if (code == ErrorCodes.MessageRateLimitExceeded)
        {
            return (
                StatusCodes.Status429TooManyRequests,
                "Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau.",
                [new ApiError("message", ErrorCodes.MessageRateLimitExceeded)],
                null);
        }

        if (code == ErrorCodes.UserBlocked || code == UserBlockedException.Code)
        {
            return (
                StatusCodes.Status403Forbidden,
                "Bạn không thể tương tác với người dùng này.",
                [new ApiError("user", ErrorCodes.UserBlocked)],
                null);
        }

        return (
            StatusCodes.Status403Forbidden,
            exception.Message,
            [new ApiError(string.Empty, ErrorCodes.Forbidden)],
            null);
    }

    private static bool ShouldUsePlainResponse(PathString path)
    {
        var value = path.Value ?? string.Empty;
        return value.Equals("/health", StringComparison.OrdinalIgnoreCase)
            || value.Equals("/api/v1/premium/webhooks/payos", StringComparison.OrdinalIgnoreCase);
    }
}
