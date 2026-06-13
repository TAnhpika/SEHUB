using SEHub.Domain.Entities;

namespace SEHub.Application.Documents;

public sealed class DocumentAccessDecision
{
    public bool CanViewMetadata { get; init; }
    public bool CanDownload { get; init; }
    public int PageLimit { get; init; }
}

public interface IDocumentAccessService
{
    void EnsureAuthenticated();

    DocumentAccessDecision Evaluate(Document document);

    bool CanViewDocument(Document document);

    bool CanPreviewDocument(Document document, int page);

    bool CanDownloadDocument(Document document);

    void EnsureCanPreview(Document document, int page);

    void EnsureCanDownload(Document document);
}
