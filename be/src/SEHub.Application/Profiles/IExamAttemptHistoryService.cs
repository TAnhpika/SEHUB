using SEHub.Contracts.Common;
using SEHub.Contracts.Profiles;

namespace SEHub.Application.Profiles;

public interface IExamAttemptHistoryService
{
    Task<PagedResult<ExamAttemptHistoryItemDto>> GetMyExamAttemptsAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
