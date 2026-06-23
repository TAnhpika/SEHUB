namespace SEHub.Infrastructure.Storage;

public sealed class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";

    public string CloudName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public bool Secure { get; set; } = true;
    public string AvatarFolder { get; set; } = "sehub/avatars";
    public string PostFolder { get; set; } = "sehub/posts";
    public string ChatFolder { get; set; } = "sehub/chat";
}
