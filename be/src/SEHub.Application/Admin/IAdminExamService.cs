using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;

namespace SEHub.Application.Admin;

public interface IAdminExamService
{
    Task<PagedResult<ExamListItemDto>> GetExamsAsync(ExamQueryParams query, CancellationToken cancellationToken = default);
    Task<AdminExamDto> GetExamAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AdminExamDto> CreateExamAsync(CreateExamRequest request, bool confirmDuplicate = false, CancellationToken cancellationToken = default);
    Task<AdminExamDto> UpdateExamAsync(Guid id, UpdateExamRequest request, CancellationToken cancellationToken = default);
    Task<AdminExamDto> ApproveExamAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AdminExamDto> RejectExamAsync(Guid id, RejectExamRequest request, CancellationToken cancellationToken = default);
    Task<AdminExamDto> ResubmitExamAsync(Guid id, ResubmitExamRequest request, CancellationToken cancellationToken = default);
    Task<AdminExamDto> CreateRevisionAsync(Guid publishedExamId, CancellationToken cancellationToken = default);
    Task<UploadExamAssetResponse> UploadAssetAsync(
        Stream fileContent,
        string fileName,
        string mimeType,
        CancellationToken cancellationToken = default);
}
