using System.Text.Json;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Drive.v3;
using Google.Apis.Services;

namespace SEHub.Infrastructure.Storage;

internal static class GoogleDriveClientFactory
{
    internal static readonly string[] ServiceAccountScopes = [DriveService.Scope.Drive];
    internal static readonly string[] OAuthScopes = [DriveService.Scope.Drive];

    internal static string ResolvePath(string configuredPath)
    {
        if (Path.IsPathRooted(configuredPath))
        {
            return configuredPath;
        }

        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), configuredPath));
    }

    internal static string? ReadServiceAccountEmail(string serviceAccountPath)
    {
        try
        {
            using var document = JsonDocument.Parse(File.ReadAllText(serviceAccountPath));
            return document.RootElement.TryGetProperty("client_email", out var email)
                ? email.GetString()
                : null;
        }
        catch
        {
            return null;
        }
    }

    internal static DriveService CreateDriveServiceFromOAuth(
        string clientId,
        string clientSecret,
        string refreshToken)
    {
        var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = clientId.Trim(),
                ClientSecret = clientSecret.Trim()
            },
            Scopes = OAuthScopes
        });

        var credential = new UserCredential(
            flow,
            "sehub-drive",
            new TokenResponse { RefreshToken = refreshToken.Trim() });

        return new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "SEHub"
        });
    }

    internal static DriveService CreateDriveServiceFromServiceAccount(
        string serviceAccountPath,
        string? impersonateUser = null)
    {
        var credential = GoogleCredential.FromFile(serviceAccountPath).CreateScoped(ServiceAccountScopes);

        if (!string.IsNullOrWhiteSpace(impersonateUser))
        {
            credential = credential.CreateWithUser(impersonateUser.Trim());
        }

        return new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "SEHub"
        });
    }
}
