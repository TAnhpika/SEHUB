using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;

namespace SEHub.Application.Admin;

public interface IModerationService
{
    Task<PagedResult<ReportDto>> GetReportsAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default);
    Task<ReportDto> GetReportAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ReportDto> ResolveReportAsync(Guid id, ResolveReportRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BannedUserDto>> GetBannedUsersAsync(CancellationToken cancellationToken = default);
    Task<ModerationStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
    Task<PagedResult<ModerationPostListItemDto>> GetPostsAsync(ModerationPostQueryParams query, CancellationToken cancellationToken = default);
    Task<ModerationPostDetailDto> GetPostAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ModerationPostDetailDto> ModeratePostAsync(Guid id, ModeratePostRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<ViolatingUserDto>> GetViolatingUsersAsync(ViolationsQueryParams query, CancellationToken cancellationToken = default);
    Task<ViolatingUserDetailDto> GetViolatingUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ViolatingUserDto> BanUserAsync(Guid userId, ModeratorBanUserRequest request, CancellationToken cancellationToken = default);
    Task<ViolatingUserDto> WarnUserAsync(Guid userId, ModeratorWarnUserRequest request, CancellationToken cancellationToken = default);
    Task<ViolatingUserDto> UnbanUserAsync(Guid userId, UnbanUserRequest request, CancellationToken cancellationToken = default);
    [Obsolete("Deprecated: ban/warn directly from reports UI. ViolationEscalations is a dead path; table drop is a follow-up.")]
    Task<EscalateUserReportResultDto> EscalateUserReportAsync(
        Guid reportId, EscalateUserReportRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<PracticeSubmissionListItemDto>> GetPracticeSubmissionsAsync(
        int page, int pageSize, string? status, CancellationToken cancellationToken = default);
}
