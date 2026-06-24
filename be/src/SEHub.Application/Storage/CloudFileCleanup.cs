using SEHub.Application.Abstractions;

namespace SEHub.Application.Storage;

public static class CloudFileCleanup
{
    public static async Task TryDeleteAsync(
        ICloudFileStorageService storage,
        string? driveFileId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(driveFileId))
        {
            return;
        }

        try
        {
            await storage.DeleteAsync(driveFileId, cancellationToken);
        }
        catch
        {
            // Best-effort cleanup when deleting stored files.
        }
    }
}
