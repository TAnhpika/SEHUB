namespace SEHub.Application.Abstractions;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream content, string fileName, string contentType, string folder, CancellationToken cancellationToken = default);
    Task<string> GetSignedUrlAsync(string filePath, TimeSpan expiry, CancellationToken cancellationToken = default);
    Task<Stream> OpenReadAsync(string filePath, CancellationToken cancellationToken = default);
    Task DeleteAsync(string filePath, CancellationToken cancellationToken = default);
}
