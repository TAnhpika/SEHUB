using Microsoft.Extensions.Configuration;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Storage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly string _publicBaseUrl;

    public LocalFileStorageService(IConfiguration configuration)
    {
        _basePath = configuration["FileStorage:LocalPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        _publicBaseUrl = configuration["FileStorage:PublicBaseUrl"] ?? "/uploads";
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> UploadAsync(
        Stream content, string fileName, string contentType, string folder,
        CancellationToken cancellationToken = default)
    {
        var safeFolder = SanitizePath(folder);
        var safeFileName = $"{Guid.NewGuid():N}_{SanitizeFileName(fileName)}";
        var relativePath = Path.Combine(safeFolder, safeFileName).Replace('\\', '/');
        var fullPath = Path.Combine(_basePath, safeFolder);

        Directory.CreateDirectory(fullPath);
        var targetPath = Path.Combine(fullPath, safeFileName);

        await using var fileStream = new FileStream(targetPath, FileMode.CreateNew, FileAccess.Write);
        await content.CopyToAsync(fileStream, cancellationToken);

        return relativePath;
    }

    public Task<string> GetSignedUrlAsync(string filePath, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        var url = $"{_publicBaseUrl.TrimEnd('/')}/{filePath.Replace('\\', '/')}";
        return Task.FromResult(url);
    }

    public Task<Stream> OpenReadAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var fullPath = GetFullPath(filePath);
        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException("File not found.", filePath);
        }

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var fullPath = GetFullPath(filePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    private string GetFullPath(string filePath)
    {
        var combined = Path.GetFullPath(Path.Combine(_basePath, filePath));
        if (!combined.StartsWith(Path.GetFullPath(_basePath), StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid file path.");
        }

        return combined;
    }

    private static string SanitizeFileName(string fileName) =>
        Path.GetFileName(fileName).Replace("..", string.Empty);

    private static string SanitizePath(string folder) =>
        string.Join('/', folder.Split('/', '\\').Where(s => !string.IsNullOrWhiteSpace(s) && s != ".."));
}
