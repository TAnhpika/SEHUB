namespace SEHub.Shared.Constants;

public static class ErrorCodes
{
    public const string ValidationFailed = "VALIDATION_FAILED";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string AccountBanned = "ACCOUNT_BANNED";
    public const string PremiumRequired = "PREMIUM_REQUIRED";
    public const string Forbidden = "FORBIDDEN";
    public const string NotFound = "NOT_FOUND";
    public const string DuplicateExam = "DUPLICATE_EXAM";
    public const string ActiveAttemptExists = "ACTIVE_ATTEMPT_EXISTS";
    public const string TokenLimitExceeded = "TOKEN_LIMIT_EXCEEDED";
    public const string EmailNotConfirmed = "EMAIL_NOT_CONFIRMED";
    public const string OtpInvalid = "OTP_INVALID";
    public const string OtpCooldown = "OTP_COOLDOWN";
    public const string OtpRateLimitExceeded = "OTP_RATE_LIMIT_EXCEEDED";
    public const string OtpMaxAttempts = "OTP_MAX_ATTEMPTS";
    public const string RefreshTokenInvalid = "REFRESH_TOKEN_INVALID";
    public const string RefreshTokenExpired = "REFRESH_TOKEN_EXPIRED";
    public const string RefreshTokenReuseDetected = "REFRESH_TOKEN_REUSE_DETECTED";
    public const string AuthRateLimitExceeded = "AUTH_RATE_LIMIT_EXCEEDED";
    public const string GoogleTokenInvalid = "GOOGLE_TOKEN_INVALID";
    public const string EmailDeliveryFailed = "EMAIL_DELIVERY_FAILED";
    public const string AiProviderUnavailable = "AI_PROVIDER_UNAVAILABLE";
    public const string UserBlocked = "USER_BLOCKED";
    public const string MessageRateLimitExceeded = "MESSAGE_RATE_LIMIT_EXCEEDED";
    public const string FileTooLarge = "FILE_TOO_LARGE";
    public const string InvalidFileType = "INVALID_FILE_TYPE";
    public const string StorageUploadFailed = "STORAGE_UPLOAD_FAILED";
    public const string StorageNotConfigured = "STORAGE_NOT_CONFIGURED";
}
