using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Storage;

public sealed class CdnFolderSettings : ICdnFolderSettings
{
    public CdnFolderSettings(IOptions<CloudinaryOptions> options)
    {
        var settings = options.Value;
        Avatars = NormalizeFolder(settings.AvatarFolder, "sehub/avatars");
        Posts = NormalizeFolder(settings.PostFolder, "sehub/posts");
        Chat = NormalizeFolder(settings.ChatFolder, "sehub/chat");
    }

    public string Avatars { get; }
    public string Posts { get; }
    public string Chat { get; }

    private static string NormalizeFolder(string? value, string fallback)
    {
        var trimmed = value?.Trim().Trim('/');
        return string.IsNullOrWhiteSpace(trimmed) ? fallback : trimmed;
    }
}
