using SEHub.Application.Models;

namespace SEHub.Application.Abstractions;

public interface IImageCdnStorageService
{
    Task<CdnUploadResult> UploadImageAsync(
        Stream stream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default);

    Task<CdnUploadResult> UploadRawAsync(
        Stream stream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string publicId, bool isRaw = false, CancellationToken cancellationToken = default);
}
