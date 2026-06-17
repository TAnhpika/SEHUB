using SEHub.Application.Models;

namespace SEHub.Application.Abstractions;

public interface ICloudFileStorageService
{
    Task<CloudFileUploadResult> UploadAsync(
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string driveFileId, CancellationToken cancellationToken = default);

    Task<CloudFileReadResult> OpenReadAsync(string driveFileId, CancellationToken cancellationToken = default);
}
