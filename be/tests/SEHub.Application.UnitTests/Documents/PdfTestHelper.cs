using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace SEHub.Application.UnitTests.Documents;

internal static class PdfTestHelper
{
    public static MemoryStream CreatePdf(int pageCount)
    {
        var document = new PdfDocument();
        for (var i = 0; i < pageCount; i++)
        {
            document.AddPage();
        }

        var stream = new MemoryStream();
        document.Save(stream, closeStream: false);
        document.Close();
        stream.Position = 0;
        return stream;
    }

    public static int GetPageCount(Stream pdfStream)
    {
        using var document = PdfReader.Open(pdfStream, PdfDocumentOpenMode.Import);
        return document.PageCount;
    }
}
