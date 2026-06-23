using System.Collections.Concurrent;
using SEHub.Application.Abstractions;
using SEHub.Application.Models;

namespace SEHub.API.IntegrationTests.Storage;

public sealed class FakeImageCdnStorageService : IImageCdnStorageService
{
    private readonly ConcurrentDictionary<string, byte[]> _files = new();

    public Task<CdnUploadResult> UploadImageAsync(
        Stream stream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default) =>
        UploadInternal(stream, fileName, contentType, folder);

    public Task<CdnUploadResult> UploadRawAsync(
        Stream stream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default) =>
        UploadInternal(stream, fileName, contentType, folder);

    public Task DeleteAsync(string publicId, bool isRaw = false, CancellationToken cancellationToken = default)
    {
        _files.TryRemove(publicId, out _);
        return Task.CompletedTask;
    }

    private Task<CdnUploadResult> UploadInternal(
        Stream stream,
        string fileName,
        string contentType,
        string folder)
    {
        using var memory = new MemoryStream();
        stream.CopyTo(memory);
        var bytes = memory.ToArray();
        var publicId = $"{folder}/{Guid.NewGuid():N}";

        _files[publicId] = bytes;

        return Task.FromResult(new CdnUploadResult
        {
            PublicId = publicId,
            Url = $"https://res.cloudinary.com/test/{(contentType.StartsWith("image/") ? "image" : "raw")}/upload/{publicId}.bin",
            ContentType = contentType,
            FileSize = bytes.LongLength
        });
    }
}
