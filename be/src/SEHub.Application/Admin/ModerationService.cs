using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Admin;

public sealed class ModerationService : IModerationService
{
    private readonly IPostReportRepository _reportRepository;
    private readonly IPostRepository _postRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserBanRepository _banRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public ModerationService(
        IPostReportRepository reportRepository,
        IPostRepository postRepository,
        IUserRepository userRepository,
        IUserBanRepository banRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _reportRepository = reportRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
        _banRepository = banRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<ReportDto>> GetReportsAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default)
    {
        ReportStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReportStatus>(status, true, out var parsed))
        {
            statusFilter = parsed;
        }

        var (items, total) = await _reportRepository.GetPagedAsync(page, pageSize, statusFilter, cancellationToken);
        var dtos = new List<ReportDto>();

        foreach (var report in items)
        {
            dtos.Add(await MapReportAsync(report, cancellationToken));
        }

        return new PagedResult<ReportDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<ReportDto> GetReportAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var report = await _reportRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("PostReport", id);

        return await MapReportAsync(report, cancellationToken);
    }

    public async Task<ReportDto> ResolveReportAsync(Guid id, ResolveReportRequest request, CancellationToken cancellationToken = default)
    {
        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var report = await _reportRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("PostReport", id);

        if (!Enum.TryParse<ReportStatus>(request.Status, true, out var status))
        {
            throw new ForbiddenException("Invalid report status.");
        }

        report.Status = status;
        report.ResolvedById = actorId;
        report.UpdatedAt = DateTime.UtcNow;

        if (request.Action?.Equals("delete_post", StringComparison.OrdinalIgnoreCase) == true)
        {
            var post = await _postRepository.GetByIdAsync(report.PostId, cancellationToken);
            if (post is not null)
            {
                await _postRepository.SoftDeleteAsync(post, actorId, cancellationToken);
            }
        }

        await _reportRepository.UpdateAsync(report, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapReportAsync(report, cancellationToken);
    }

    public async Task<IReadOnlyList<BannedUserDto>> GetBannedUsersAsync(CancellationToken cancellationToken = default)
    {
        var bans = await _banRepository.GetActiveBansAsync(cancellationToken);
        var result = new List<BannedUserDto>();

        foreach (var ban in bans)
        {
            var user = await _userRepository.GetByIdAsync(ban.UserId, cancellationToken);
            if (user is null || !user.IsBanned)
            {
                continue;
            }

            result.Add(new BannedUserDto
            {
                Id = ban.Id,
                UserId = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                BanType = ban.BanType.ToString(),
                Until = ban.Until,
                Reason = ban.Reason,
                CreatedAt = ban.CreatedAt
            });
        }

        return result;
    }

    private async Task<ReportDto> MapReportAsync(Domain.Entities.PostReport report, CancellationToken cancellationToken)
    {
        var post = await _postRepository.GetByIdAsync(report.PostId, cancellationToken);
        var reporter = await _userRepository.GetByIdAsync(report.ReporterId, cancellationToken);

        return new ReportDto
        {
            Id = report.Id,
            PostId = report.PostId,
            PostTitle = post?.Title ?? "Unknown",
            Reason = report.Reason,
            Status = report.Status.ToString(),
            Reporter = new ReportUserSummaryDto
            {
                Id = report.ReporterId,
                Username = reporter?.Username ?? "unknown",
                DisplayName = reporter?.DisplayName ?? "Unknown"
            },
            CreatedAt = report.CreatedAt,
            ResolvedAt = report.Status != ReportStatus.Pending ? report.UpdatedAt : null
        };
    }
}
