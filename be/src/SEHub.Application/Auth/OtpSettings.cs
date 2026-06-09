namespace SEHub.Application.Auth;

public sealed class OtpSettings
{
    public const string SectionName = "Otp";

    public int ResendCooldownSeconds { get; set; } = 60;
    public int MaxAttempts { get; set; } = 5;
    public int MaxRequestsPerHour { get; set; } = 5;
    public int ExpiryMinutes { get; set; } = 10;
}
