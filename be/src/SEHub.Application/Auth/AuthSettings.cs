namespace SEHub.Application.Auth;

public sealed class AuthSettings
{
    public const string SectionName = "Auth";

    public bool RequireConfirmedEmail { get; set; }
}
