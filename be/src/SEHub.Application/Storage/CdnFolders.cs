namespace SEHub.Application.Storage;

/// <summary>
/// Default Cloudinary folder paths. Runtime values come from <see cref="Abstractions.ICdnFolderSettings"/> (Cloudinary:* config).
/// </summary>
public static class CdnFolders
{
    public const string Avatars = "sehub/avatars";
    public const string Posts = "sehub/posts";
    public const string Chat = "sehub/chat";
    public const string Exam = "exam";
}
