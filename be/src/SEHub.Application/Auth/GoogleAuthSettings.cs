namespace SEHub.Application.Auth;

public sealed class GoogleAuthSettings
{
    public const string SectionName = "Google";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}
