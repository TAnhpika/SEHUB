using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;
using SEHub.Application.Abstractions;
using SEHub.Domain.Exceptions;

namespace SEHub.Infrastructure.Documents;

public sealed class PdfPageExtractor : IPdfPageExtractor
{
    public int GetPageCount(Stream pdfStream)
    {
        using var buffered = CopyToMemoryStream(pdfStream);

        try
        {
            using var document = PdfReader.Open(buffered, PdfDocumentOpenMode.Import);
            return document.PageCount;
        }
        catch (Exception ex)
        {
            throw new DomainException("Unable to read PDF document.", ex);
        }
    }

    public Task<MemoryStream> ExtractSinglePageAsync(
        Stream pdfStream,
        int page,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        using var input = pdfStream;
        using var buffered = CopyToMemoryStream(input);

        PdfDocument sourceDocument;
        try
        {
            sourceDocument = PdfReader.Open(buffered, PdfDocumentOpenMode.Import);
        }
        catch (Exception ex)
        {
            throw new DomainException("Unable to read PDF document for preview.", ex);
        }

        using (sourceDocument)
        {
            if (page < 1 || page > sourceDocument.PageCount)
            {
                throw new NotFoundException($"Page {page} is out of range.");
            }

            var outputDocument = new PdfDocument();
            outputDocument.AddPage(sourceDocument.Pages[page - 1]);

            var output = new MemoryStream();
            outputDocument.Save(output, closeStream: false);
            outputDocument.Close();
            output.Position = 0;
            return Task.FromResult(output);
        }
    }

    private static MemoryStream CopyToMemoryStream(Stream source)
    {
        var memory = new MemoryStream();
        source.CopyTo(memory);
        memory.Position = 0;
        return memory;
    }
}
