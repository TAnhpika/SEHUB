namespace SEHub.Infrastructure.Email;

public sealed class EmailSettings
{
    public const string SectionName = "Email";

    public string Provider { get; set; } = "Logging";

    public SmtpSettings Smtp { get; set; } = new();
}

public sealed class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = "noreply@sehub.local";
    public string FromDisplayName { get; set; } = "SEHub";
    public bool EnableSsl { get; set; } = true;
}
