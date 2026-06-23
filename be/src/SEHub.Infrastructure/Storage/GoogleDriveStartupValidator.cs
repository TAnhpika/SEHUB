using Google;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SEHub.Infrastructure.Storage;

public static class GoogleDriveStartupValidator
{
    public static void ValidateAndWarn(IServiceProvider services)
    {
        var options = services.GetRequiredService<IOptions<GoogleDriveOptions>>().Value;
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("GoogleDrive");

        if (string.IsNullOrWhiteSpace(options.FolderId))
        {
            logger.LogWarning(
                "Google Drive storage is not fully configured. Set GoogleDrive:FolderId and either OAuth credentials or ServiceAccountPath.");
            return;
        }

        if (!options.UsesOAuth && !options.UsesServiceAccount)
        {
            logger.LogWarning(
                "Google Drive storage is not fully configured. Provide OAuthClientId/Secret/RefreshToken or ServiceAccountPath.");
            return;
        }

        try
        {
            Google.Apis.Drive.v3.DriveService drive;
            string authMode;

            if (options.UsesOAuth)
            {
                authMode = "OAuth user token";
                drive = GoogleDriveClientFactory.CreateDriveServiceFromOAuth(
                    options.OAuthClientId,
                    options.OAuthClientSecret,
                    options.RefreshToken);
            }
            else
            {
                authMode = "service account";
                var path = GoogleDriveClientFactory.ResolvePath(options.ServiceAccountPath!);
                if (!File.Exists(path))
                {
                    logger.LogWarning("Google Drive service account file not found at {Path}.", path);
                    return;
                }

                var serviceAccountEmail = GoogleDriveClientFactory.ReadServiceAccountEmail(path);
                drive = GoogleDriveClientFactory.CreateDriveServiceFromServiceAccount(path, options.ImpersonateUser);
                logger.LogInformation(
                    "Google Drive service account: {ServiceAccountEmail}, impersonate={ImpersonateUser}",
                    serviceAccountEmail ?? "(unknown)",
                    options.ImpersonateUser ?? "(none)");
            }

            logger.LogInformation(
                "Google Drive configured: auth={AuthMode}, folder={FolderId}",
                authMode,
                options.FolderId);

            var request = drive.Files.Get(options.FolderId);
            request.SupportsAllDrives = true;
            request.Fields = "id,name,mimeType,driveId";
            var folder = request.Execute();

            var isSharedDrive = !string.IsNullOrWhiteSpace(folder.DriveId);
            logger.LogInformation(
                "Google Drive folder access OK: {FolderName} ({FolderId}), sharedDrive={IsSharedDrive}",
                folder.Name ?? options.FolderId,
                folder.Id,
                isSharedDrive);

            if (options.UsesServiceAccount && !isSharedDrive && string.IsNullOrWhiteSpace(options.ImpersonateUser))
            {
                var path = GoogleDriveClientFactory.ResolvePath(options.ServiceAccountPath);
                var serviceAccountEmail = GoogleDriveClientFactory.ReadServiceAccountEmail(path);
                LogServiceAccountFolderPermission(drive, options.FolderId, serviceAccountEmail, logger);

                logger.LogWarning(
                    "Service account + My Drive folder often fails with storageQuotaExceeded. Prefer OAuth RefreshToken or a Shared drive folder.");
            }
        }
        catch (GoogleApiException ex)
        {
            if (options.UsesOAuth && ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
            {
                logger.LogWarning(
                    "Google Drive folder {FolderId} not visible to OAuth token. " +
                    "Re-authorize with scope https://www.googleapis.com/auth/drive using the same Google account that owns the folder, then update RefreshToken.",
                    options.FolderId);
            }
            else
            {
                logger.LogWarning(
                    ex,
                    "Google Drive folder {FolderId} is not accessible. Error: {Message}",
                    options.FolderId,
                    ex.Message);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Could not verify Google Drive folder {FolderId}. Uploads may fail until configuration is fixed.",
                options.FolderId);
        }
    }

    private static void LogServiceAccountFolderPermission(
        Google.Apis.Drive.v3.DriveService drive,
        string folderId,
        string? serviceAccountEmail,
        ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(serviceAccountEmail))
        {
            return;
        }

        try
        {
            var request = drive.Permissions.List(folderId);
            request.SupportsAllDrives = true;
            request.Fields = "permissions(emailAddress,role,type)";
            var permissions = request.Execute().Permissions ?? [];

            var match = permissions.FirstOrDefault(permission =>
                string.Equals(permission.EmailAddress, serviceAccountEmail, StringComparison.OrdinalIgnoreCase));

            logger.LogInformation(
                "Service account {Email} permission on folder {FolderId}: {Role}",
                serviceAccountEmail,
                folderId,
                match?.Role ?? "not listed (share may be missing)");
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Could not list permissions for folder {FolderId}", folderId);
        }
    }
}
