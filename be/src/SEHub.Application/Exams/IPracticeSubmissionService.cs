using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;

namespace SEHub.Application.Exams;

public interface IPracticeSubmissionService
{
    Task<PracticeSubmissionDto> SubmitAsync(Guid examId, SubmitPracticeRequest request, CancellationToken cancellationToken = default);
    Task<PracticeSubmissionDto?> GetMySubmissionAsync(Guid examId, CancellationToken cancellationToken = default);
    Task<PagedResult<PracticeSubmissionListItemDto>> GetSubmissionsAsync(Guid examId, int page, int pageSize, string? status, CancellationToken cancellationToken = default);
    Task<PracticeSubmissionDto> ReviewAsync(Guid examId, Guid submissionId, ReviewPracticeRequest request, CancellationToken cancellationToken = default);
}
