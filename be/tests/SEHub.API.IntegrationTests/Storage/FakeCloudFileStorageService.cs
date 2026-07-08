using System.Collections.Concurrent;
using SEHub.Application.Abstractions;
using SEHub.Application.Models;

namespace SEHub.API.IntegrationTests.Storage;

public sealed class FakeCloudFileStorageService : ICloudFileStorageService
{
    private readonly ConcurrentDictionary<string, byte[]> _files = new();

    public int OpenReadCallCount { get; private set; }

    public void ResetOpenReadCallCount() => OpenReadCallCount = 0;

    public Task<CloudFileUploadResult> UploadAsync(
        Stream stream,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        using var memory = new MemoryStream();
        stream.CopyTo(memory);
        var bytes = memory.ToArray();
        var driveFileId = Guid.NewGuid().ToString("N");

        _files[driveFileId] = bytes;

        return Task.FromResult(new CloudFileUploadResult
        {
            DriveFileId = driveFileId,
            OriginalFileName = Path.GetFileName(fileName),
            ContentType = contentType,
            FileSize = bytes.LongLength
        });
    }

    public Task DeleteAsync(string driveFileId, CancellationToken cancellationToken = default)
    {
        _files.TryRemove(driveFileId, out _);
        return Task.CompletedTask;
    }

    public Task<CloudFileReadResult> OpenReadAsync(string driveFileId, CancellationToken cancellationToken = default)
    {
        OpenReadCallCount++;
        if (!_files.TryGetValue(driveFileId, out var bytes))
        {
            throw new FileNotFoundException("Drive file not found.", driveFileId);
        }

        var stream = new MemoryStream(bytes, writable: false);
        return Task.FromResult(new CloudFileReadResult
        {
            Stream = stream,
            ContentType = "application/octet-stream",
            FileName = driveFileId
        });
    }
}
