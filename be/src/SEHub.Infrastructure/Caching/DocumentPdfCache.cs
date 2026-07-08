using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Caching;

public sealed class DocumentPdfCache : IDocumentPdfCache
{
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(10);
    private readonly IMemoryCache _cache;

    public DocumentPdfCache(IMemoryCache cache)
    {
        _cache = cache;
    }

    public async Task<MemoryStream> OpenPdfAsync(
        Guid documentId,
        Func<CancellationToken, Task<Stream>> loadFromStorage,
        CancellationToken cancellationToken = default)
    {
        var key = BuildKey(documentId);
        if (_cache.TryGetValue(key, out byte[]? cached) && cached is { Length: > 0 })
        {
            return new MemoryStream(cached, writable: false);
        }

        await using var source = await loadFromStorage(cancellationToken);
        using var buffer = new MemoryStream();
        await source.CopyToAsync(buffer, cancellationToken);
        var bytes = buffer.ToArray();

        _cache.Set(
            key,
            bytes,
            new MemoryCacheEntryOptions
            {
                SlidingExpiration = DefaultTtl
            });

        return new MemoryStream(bytes, writable: false);
    }

    public void Invalidate(Guid documentId)
    {
        _cache.Remove(BuildKey(documentId));
    }

    private static string BuildKey(Guid documentId) => $"doc-pdf:{documentId:D}";
}
