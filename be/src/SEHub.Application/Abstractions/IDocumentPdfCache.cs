namespace SEHub.Application.Abstractions;

public interface IDocumentPdfCache
{
    Task<MemoryStream> OpenPdfAsync(
        Guid documentId,
        Func<CancellationToken, Task<Stream>> loadFromStorage,
        CancellationToken cancellationToken = default);

    void Invalidate(Guid documentId);
}
