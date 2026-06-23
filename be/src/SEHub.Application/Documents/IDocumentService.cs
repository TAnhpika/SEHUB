using SEHub.Contracts.Common;
using SEHub.Contracts.Documents;

namespace SEHub.Application.Documents;

public interface IDocumentService
{
    Task<PagedResult<DocumentListItemDto>> GetDocumentsAsync(DocumentQueryParams query, CancellationToken cancellationToken = default);
    Task<DocumentDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DocumentPreviewDto> GetPreviewAsync(Guid id, int page, CancellationToken cancellationToken = default);
    Task<string> GetDownloadUrlAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DocumentContentResult> GetContentAsync(Guid id, int? page, CancellationToken cancellationToken = default);
}
