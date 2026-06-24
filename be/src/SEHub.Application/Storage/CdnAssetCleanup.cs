using SEHub.Application.Abstractions;

namespace SEHub.Application.Storage;

public static class CdnAssetCleanup
{
    public static async Task TryDeleteAsync(
        IImageCdnStorageService cdn,
        string? publicId,
        string? url,
        bool isRaw = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(publicId))
            {
                await cdn.DeleteAsync(publicId, isRaw, cancellationToken);
                return;
            }

            if (CdnUrlHelper.TryGetPublicId(url, out var parsedId, out var parsedRaw))
            {
                await cdn.DeleteAsync(parsedId, parsedRaw, cancellationToken);
            }
        }
        catch
        {
            // Best-effort cleanup when deleting or replacing stored media.
        }
    }
}
