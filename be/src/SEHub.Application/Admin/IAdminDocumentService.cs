using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;

namespace SEHub.Application.Admin;

public interface IAdminDocumentService
{
    Task<PagedResult<AdminDocumentDto>> GetDocumentsAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<AdminDocumentDto> GetDocumentAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AdminDocumentDto> UploadAsync(
        UploadDocumentRequest request,
        Stream fileContent,
        string fileName,
        string mimeType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default);
    Task<AdminDocumentDto> UpdateAsync(Guid id, UpdateDocumentRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
