using System.Text.RegularExpressions;

namespace SEHub.Application.Storage;

public static partial class CdnUrlHelper
{
    [GeneratedRegex(@"/upload/(?:[^/]+/)*v\d+/(.+)$", RegexOptions.IgnoreCase)]
    private static partial Regex VersionedUploadRegex();

    [GeneratedRegex(@"/upload/(.+)$", RegexOptions.IgnoreCase)]
    private static partial Regex PlainUploadRegex();

    public static bool IsCloudinaryUrl(string? url) =>
        !string.IsNullOrWhiteSpace(url)
        && Uri.TryCreate(url, UriKind.Absolute, out var uri)
        && uri.Host.Contains("cloudinary.com", StringComparison.OrdinalIgnoreCase);

    public static bool TryGetPublicId(string? url, out string publicId, out bool isRaw)
    {
        publicId = string.Empty;
        isRaw = false;

        if (!IsCloudinaryUrl(url) || url is null)
        {
            return false;
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return false;
        }

        isRaw = uri.AbsolutePath.Contains("/raw/upload/", StringComparison.OrdinalIgnoreCase);

        var match = VersionedUploadRegex().Match(uri.AbsolutePath);
        if (!match.Success)
        {
            match = PlainUploadRegex().Match(uri.AbsolutePath);
        }

        if (!match.Success)
        {
            return false;
        }

        publicId = match.Groups[1].Value;
        var dotIndex = publicId.LastIndexOf('.');
        if (dotIndex > publicId.LastIndexOf('/'))
        {
            publicId = publicId[..dotIndex];
        }

        return !string.IsNullOrWhiteSpace(publicId);
    }
}
