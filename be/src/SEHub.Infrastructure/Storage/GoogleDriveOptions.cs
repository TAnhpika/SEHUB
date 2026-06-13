namespace SEHub.Infrastructure.Storage;

public sealed class GoogleDriveOptions
{
    public const string SectionName = "GoogleDrive";

    public string FolderId { get; set; } = string.Empty;

    /// <summary>OAuth client ID (Web application) used for Drive uploads.</summary>
    public string OAuthClientId { get; set; } = string.Empty;

    /// <summary>OAuth client secret paired with <see cref="OAuthClientId"/>.</summary>
    public string OAuthClientSecret { get; set; } = string.Empty;

    /// <summary>Long-lived refresh token authorized for Drive (user quota).</summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>Fallback: service account JSON path when OAuth is not configured.</summary>
    public string ServiceAccountPath { get; set; } = string.Empty;

    /// <summary>
    /// Optional. Workspace domain-wide delegation when using service account.
    /// </summary>
    public string? ImpersonateUser { get; set; }

    public bool UsesOAuth =>
        !string.IsNullOrWhiteSpace(OAuthClientId)
        && !string.IsNullOrWhiteSpace(OAuthClientSecret)
        && !string.IsNullOrWhiteSpace(RefreshToken);

    public bool UsesServiceAccount =>
        !UsesOAuth && !string.IsNullOrWhiteSpace(ServiceAccountPath);
}
