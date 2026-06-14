using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SEHub.Infrastructure.Storage;

public static class CloudinaryStartupValidator
{
    public static void ValidateAndWarn(IServiceProvider services)
    {
        var options = services.GetRequiredService<IOptions<CloudinaryOptions>>().Value;
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("Cloudinary");

        if (string.IsNullOrWhiteSpace(options.CloudName)
            || string.IsNullOrWhiteSpace(options.ApiKey)
            || string.IsNullOrWhiteSpace(options.ApiSecret))
        {
            logger.LogWarning(
                "Cloudinary is not fully configured. Avatar, post image, and chat uploads will fail until Cloudinary:CloudName, ApiKey, and ApiSecret are set.");
            return;
        }

        logger.LogInformation(
            "Cloudinary folders: avatars={AvatarFolder}, posts={PostFolder}, chat={ChatFolder}",
            options.AvatarFolder,
            options.PostFolder,
            options.ChatFolder);
    }
}
