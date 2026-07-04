namespace SEHub.Application.Abstractions;

public interface IPdfPageExtractor
{
    /// <summary>
    /// Returns the number of pages in the PDF. The input stream is not disposed.
    /// </summary>
    int GetPageCount(Stream pdfStream);

    /// <summary>
    /// Extracts a single page (1-based) from a PDF stream into a new in-memory PDF stream.
    /// The caller owns disposing the returned stream. The input stream is disposed by this method.
    /// </summary>
    Task<MemoryStream> ExtractSinglePageAsync(Stream pdfStream, int page, CancellationToken cancellationToken = default);
}
