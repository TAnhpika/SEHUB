using Microsoft.Extensions.Caching.Memory;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Feed;
using SEHub.Application.Gamification;
using SEHub.Application.Notifications;
using SEHub.Application.Profiles;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Admin;

public sealed class ModerationService : IModerationService
{
    private static readonly int[] AllowedBanDurations = [1, 7, 30];
    private const string DefaultWarningReason = "Vi phạm quy định cộng đồng SEHUB.";
    private const string ModerationStatsCacheKey = "moderation:stats";
    private static readonly TimeSpan ModerationStatsCacheDuration = TimeSpan.FromSeconds(60);

    private readonly IPostReportRepository _reportRepository;
    private readonly IPostRepository _postRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUserProfileRepository _profileRepository;
    private readonly IUserBanRepository _banRepository;
    private readonly IPracticeSubmissionRepository _submissionRepository;
    private readonly IExamRepository _examRepository;
    private readonly IGamificationService _gamificationService;
    private readonly IBadgeCheckService _badgeCheckService;
    private readonly IUserActivityService _userActivityService;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMemoryCache _cache;

    public ModerationService(
        IPostReportRepository reportRepository,
        IPostRepository postRepository,
        IUserRepository userRepository,
        IUserProfileRepository profileRepository,
        IUserBanRepository banRepository,
        IPracticeSubmissionRepository submissionRepository,
        IExamRepository examRepository,
        IGamificationService gamificationService,
        IBadgeCheckService badgeCheckService,
        IUserActivityService userActivityService,
        IWorkflowNotificationService workflowNotifications,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMemoryCache cache)
    {
        _reportRepository = reportRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
        _profileRepository = profileRepository;
        _banRepository = banRepository;
        _submissionRepository = submissionRepository;
        _examRepository = examRepository;
        _gamificationService = gamificationService;
        _badgeCheckService = badgeCheckService;
        _userActivityService = userActivityService;
        _workflowNotifications = workflowNotifications;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task<PagedResult<ReportDto>> GetReportsAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default)
    {
        ReportStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReportStatus>(status, true, out var parsed))
        {
            statusFilter = parsed;
        }

        var (items, total) = await _reportRepository.GetPagedAsync(page, pageSize, statusFilter, cancellationToken);
        var dtos = await MapReportsAsync(items, cancellationToken);

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
        InvalidateModerationStatsCache();

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

            var actor = await _userRepository.GetByIdAsync(ban.ActorId, cancellationToken);

            result.Add(new BannedUserDto
            {
                Id = ban.Id,
                UserId = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                BanType = ban.BanType.ToString(),
                Until = ban.Until,
                Reason = ban.Reason,
                CreatedAt = ban.CreatedAt,
                ActorUsername = actor?.Username
            });
        }

        return result;
    }

    public async Task<ModerationStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(ModerationStatsCacheKey, out ModerationStatsDto? cached) && cached is not null)
        {
            return cached;
        }

        var pendingPosts = await _postRepository.CountByStatusAsync(PostStatus.Pending, cancellationToken);
        var (_, pendingReports) = await _reportRepository.GetPagedAsync(1, 1, ReportStatus.Pending, cancellationToken);
        var pendingSubmissions = await _submissionRepository.CountByStatusAsync(
            PracticeSubmissionStatus.Submitted,
            cancellationToken);
        var activeBans = await _banRepository.CountActiveBansAsync(cancellationToken);
        var violatingAccounts = await _banRepository.CountDistinctViolatingUsersAsync(cancellationToken);

        var stats = new ModerationStatsDto
        {
            PendingPosts = pendingPosts,
            PendingReports = pendingReports,
            PendingPracticeSubmissions = pendingSubmissions,
            ActiveBans = activeBans,
            ViolatingAccounts = violatingAccounts
        };

        _cache.Set(ModerationStatsCacheKey, stats, ModerationStatsCacheDuration);
        return stats;
    }

    public async Task<PagedResult<ModerationPostListItemDto>> GetPostsAsync(
        ModerationPostQueryParams query, CancellationToken cancellationToken = default)
    {
        var (items, total) = await _postRepository.GetModerationPagedAsync(query, cancellationToken);
        var dtos = await MapModerationListItemsAsync(items, cancellationToken);

        return new PagedResult<ModerationPostListItemDto>
        {
            Items = dtos,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<ModerationPostDetailDto> GetPostAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var post = await _postRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Post", id);

        return await MapModerationDetailAsync(post, cancellationToken);
    }

    public async Task<ModerationPostDetailDto> ModeratePostAsync(
        Guid id, ModeratePostRequest request, CancellationToken cancellationToken = default)
    {
        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var post = await _postRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Post", id);

        if (post.Status != PostStatus.Pending && post.Status != PostStatus.Rejected)
        {
            throw new ForbiddenException("Only pending or resubmitted posts can be moderated.");
        }

        var action = request.Action.Trim().ToLowerInvariant();
        var shouldRecordAuthorActivity = false;
        post.ModeratedById = actorId;
        post.ModeratedAt = DateTime.UtcNow;
        post.ModerationNote = request.Note?.Trim();
        post.UpdatedAt = DateTime.UtcNow;

        switch (action)
        {
            case "approve":
            case "published":
                post.Status = PostStatus.Published;
                await _gamificationService.AwardPostPublishedAsync(post.AuthorId, cancellationToken);
                await _badgeCheckService.EvaluateForTriggerAsync(
                    post.AuthorId,
                    BadgeCheckService.TriggerPostsPublished,
                    cancellationToken);
                shouldRecordAuthorActivity = true;
                break;
            case "reject":
            case "rejected":
                post.Status = PostStatus.Rejected;
                if (string.IsNullOrWhiteSpace(post.ModerationNote))
                {
                    throw new ForbiddenException("Rejection requires a note.");
                }
                break;
            default:
                throw new ForbiddenException("Action must be approve or reject.");
        }

        await _postRepository.UpdateAsync(post, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (shouldRecordAuthorActivity)
        {
            await _userActivityService.RecordActivityAsync(post.AuthorId, cancellationToken);
        }

        await _workflowNotifications.NotifyPostAuthorModerationResultAsync(
            post,
            approved: action is "approve" or "published",
            actorId,
            cancellationToken);

        return await MapModerationDetailAsync(post, cancellationToken);
    }

    public async Task<PagedResult<ViolatingUserDto>> GetViolatingUsersAsync(
        ViolationsQueryParams query, CancellationToken cancellationToken = default)
    {
        var (userIds, total) = await _banRepository.GetViolatingUserIdsPagedAsync(
            query.Page,
            query.PageSize,
            query.Search,
            query.Status,
            query.Rank,
            query.Sort,
            cancellationToken);

        var items = new List<ViolatingUserDto>();
        foreach (var userId in userIds)
        {
            items.Add(await MapViolatingUserAsync(userId, cancellationToken));
        }

        return new PagedResult<ViolatingUserDto>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<ViolatingUserDetailDto> GetViolatingUserAsync(
        Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await SyncExpiredBanIfNeededAsync(userId, cancellationToken);
        var violationCount = await _banRepository.CountByUserIdAsync(userId, cancellationToken);
        if (violationCount == 0)
        {
            throw new NotFoundException("ViolatingUser", userId);
        }

        var profile = await _profileRepository.GetByUserIdAsync(userId, cancellationToken);
        var warningCount = await _banRepository.CountByUserIdAndTypeAsync(userId, BanType.Warning, cancellationToken);
        var tempBanCount = await _banRepository.CountByUserIdAndTypeAsync(userId, BanType.Temp, cancellationToken);
        var latestBan = await _banRepository.GetLatestByUserIdAsync(userId, cancellationToken);
        var historyRecords = await _banRepository.GetHistoryByUserIdAsync(userId, 1, 20, cancellationToken);
        var history = new List<ViolationHistoryItemDto>();

        foreach (var record in historyRecords)
        {
            history.Add(await MapViolationHistoryAsync(record, cancellationToken));
        }

        var summary = BuildViolatingUserDto(user, profile, violationCount, warningCount, latestBan);

        return new ViolatingUserDetailDto
        {
            Id = summary.Id,
            Username = summary.Username,
            DisplayName = summary.DisplayName,
            Email = summary.Email,
            Major = summary.Major,
            Semester = summary.Semester,
            LevelName = summary.LevelName,
            Points = summary.Points,
            ViolationCount = summary.ViolationCount,
            WarningCount = summary.WarningCount,
            TempBanCount = tempBanCount,
            Status = summary.Status,
            BanType = summary.BanType,
            BanUntil = summary.BanUntil,
            LockDurationDays = summary.LockDurationDays,
            BanReason = summary.BanReason,
            LastActionAt = summary.LastActionAt,
            History = history
        };
    }

    public async Task<ViolatingUserDto> BanUserAsync(
        Guid userId, ModeratorBanUserRequest request, CancellationToken cancellationToken = default)
    {
        if (_currentUser.Role != RoleNames.Moderator && _currentUser.Role != RoleNames.Admin)
        {
            throw new ForbiddenException("Moderator access required.");
        }

        if (_currentUser.Role == RoleNames.Moderator && !AllowedBanDurations.Contains(request.DurationDays))
        {
            throw new ForbiddenException("Moderators can only issue 1, 7, or 30 day bans.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ForbiddenException("Ban reason is required.");
        }

        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        if (user.Role == RoleNames.Admin && _currentUser.Role != RoleNames.Admin)
        {
            throw new ForbiddenException("Moderators cannot ban admin accounts.");
        }

        if (user.Role == RoleNames.Moderator && _currentUser.Role != RoleNames.Admin)
        {
            throw new ForbiddenException("Moderators cannot ban other moderators.");
        }

        var banUntil = DateTime.UtcNow.AddDays(request.DurationDays);

        await _userRepository.UpdateBanAsync(
            userId,
            true,
            banUntil,
            request.Reason.Trim(),
            BanType.Temp.ToString(),
            cancellationToken);

        await _banRepository.AddAsync(new UserBan
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ActorId = actorId,
            BanType = BanType.Temp,
            Until = banUntil,
            Reason = request.Reason.Trim(),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapViolatingUserAsync(userId, cancellationToken);
    }

    public async Task<ViolatingUserDto> WarnUserAsync(
        Guid userId, ModeratorWarnUserRequest request, CancellationToken cancellationToken = default)
    {
        var reason = string.IsNullOrWhiteSpace(request.Reason)
            ? DefaultWarningReason
            : request.Reason.Trim();

        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        if (user.Role is RoleNames.Admin or RoleNames.Moderator && _currentUser.Role != RoleNames.Admin)
        {
            throw new ForbiddenException("Moderators cannot warn staff accounts.");
        }

        await _banRepository.AddAsync(new UserBan
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ActorId = actorId,
            BanType = BanType.Warning,
            Until = null,
            Reason = reason,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapViolatingUserAsync(userId, cancellationToken);
    }

    public async Task<ViolatingUserDto> UnbanUserAsync(
        Guid userId, UnbanUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        if (!IsActiveBan(user))
        {
            throw new ForbiddenException("User is not currently banned.");
        }

        if (_currentUser.Role == RoleNames.Moderator)
        {
            var latestBan = await _banRepository.GetLatestByUserIdAsync(userId, cancellationToken);
            if (latestBan?.BanType == BanType.Permanent)
            {
                throw new ForbiddenException("Moderators cannot lift permanent bans.");
            }
        }

        await _userRepository.UpdateBanAsync(userId, false, null, null, null, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapViolatingUserAsync(userId, cancellationToken);
    }

    public async Task<PagedResult<PracticeSubmissionListItemDto>> GetPracticeSubmissionsAsync(
        int page, int pageSize, string? status, CancellationToken cancellationToken = default)
    {
        PracticeSubmissionStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status)
            && Enum.TryParse<PracticeSubmissionStatus>(status, true, out var parsed))
        {
            statusFilter = parsed;
        }

        var (items, total) = await _submissionRepository.GetPagedAsync(page, pageSize, statusFilter, cancellationToken);
        var userIds = items.Select(i => i.UserId).Distinct().ToList();
        var examIds = items.Select(i => i.ExamId).Distinct().ToList();

        var users = await _userRepository.GetByIdsAsync(userIds, cancellationToken);
        var exams = await _examRepository.GetByIdsAsync(examIds, cancellationToken);

        var usersById = (users ?? []).ToDictionary(u => u.Id);
        var examsById = (exams ?? []).ToDictionary(e => e.Id);

        var dtos = items.Select(item =>
        {
            usersById.TryGetValue(item.UserId, out var user);
            examsById.TryGetValue(item.ExamId, out var exam);

            return new PracticeSubmissionListItemDto
            {
                Id = item.Id,
                ExamId = item.ExamId,
                GitHubRepoUrl = item.GitHubRepoUrl,
                Status = item.Status.ToString(),
                SubmittedAt = item.SubmittedAt,
                ReviewerComment = item.ReviewerComment,
                ReviewedAt = item.ReviewedAt,
                User = new PracticeSubmissionUserSummaryDto
                {
                    Id = item.UserId,
                    Username = user?.Username ?? "unknown",
                    DisplayName = user?.DisplayName ?? "Unknown"
                },
                ExamTitle = exam?.Title,
                ExamCode = exam?.Code
            };
        }).ToList();

        return new PagedResult<PracticeSubmissionListItemDto>
        {
            Items = dtos,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    private async Task<ReportDto> MapReportAsync(PostReport report, CancellationToken cancellationToken)
    {
        var items = await MapReportsAsync([report], cancellationToken);
        return items[0];
    }

    private async Task<IReadOnlyList<ReportDto>> MapReportsAsync(
        IReadOnlyList<PostReport> reports,
        CancellationToken cancellationToken)
    {
        if (reports.Count == 0)
        {
            return [];
        }

        var postIds = reports.Select(r => r.PostId).Distinct().ToList();
        var reporterIds = reports.Select(r => r.ReporterId).Distinct().ToList();

        var posts = await _postRepository.GetByIdsIncludingDeletedAsync(postIds, cancellationToken);
        var postsById = posts.ToDictionary(p => p.Id);

        var authorIds = posts.Select(p => p.AuthorId).Distinct().ToList();
        var userIds = reporterIds.Concat(authorIds).Distinct().ToList();
        var usersById = ((await _userRepository.GetByIdsAsync(userIds, cancellationToken)) ?? [])
            .ToDictionary(u => u.Id);

        var dtos = new List<ReportDto>(reports.Count);
        foreach (var report in reports)
        {
            postsById.TryGetValue(report.PostId, out var post);
            usersById.TryGetValue(report.ReporterId, out var reporter);
            Models.UserAccount? author = null;
            if (post is not null)
            {
                usersById.TryGetValue(post.AuthorId, out author);
            }

            dtos.Add(new ReportDto
            {
                Id = report.Id,
                PostId = report.PostId,
                PostTitle = post?.Title ?? "Unknown",
                PostExcerpt = post is null ? null : BuildExcerpt(post.Content),
                Reason = report.Reason,
                Status = report.Status.ToString(),
                Reporter = new ReportUserSummaryDto
                {
                    Id = report.ReporterId,
                    Username = reporter?.Username ?? "unknown",
                    DisplayName = reporter?.DisplayName ?? "Unknown"
                },
                ReportedUser = author is null
                    ? null
                    : new ReportUserSummaryDto
                    {
                        Id = author.Id,
                        Username = author.Username,
                        DisplayName = author.DisplayName
                    },
                CreatedAt = report.CreatedAt,
                ResolvedAt = report.Status != ReportStatus.Pending ? report.UpdatedAt : null
            });
        }

        return dtos;
    }

    private async Task<ModerationPostListItemDto> MapModerationListItemAsync(Post post, CancellationToken cancellationToken)
    {
        var items = await MapModerationListItemsAsync([post], cancellationToken);
        return items[0];
    }

    private async Task<IReadOnlyList<ModerationPostListItemDto>> MapModerationListItemsAsync(
        IReadOnlyList<Post> posts,
        CancellationToken cancellationToken)
    {
        if (posts.Count == 0)
        {
            return [];
        }

        var authorIds = posts.Select(p => p.AuthorId).Distinct().ToList();
        var moderatorIds = posts
            .Where(p => p.ModeratedById is Guid)
            .Select(p => p.ModeratedById!.Value)
            .Distinct()
            .ToList();
        var userIds = authorIds.Concat(moderatorIds).Distinct().ToList();

        var users = await _userRepository.GetByIdsAsync(userIds, cancellationToken);
        var profiles = await _profileRepository.GetByUserIdsAsync(authorIds, cancellationToken);

        var usersById = (users ?? []).ToDictionary(u => u.Id);
        var profilesByUserId = (profiles ?? []).ToDictionary(p => p.UserId);

        var dtos = new List<ModerationPostListItemDto>(posts.Count);
        foreach (var post in posts)
        {
            usersById.TryGetValue(post.AuthorId, out var authorUser);
            Models.UserAccount? moderator = null;
            if (post.ModeratedById is Guid moderatorId)
            {
                usersById.TryGetValue(moderatorId, out moderator);
            }

            profilesByUserId.TryGetValue(post.AuthorId, out var profile);

            dtos.Add(new ModerationPostListItemDto
            {
                Id = post.Id,
                Title = post.Title,
                Excerpt = BuildExcerpt(post.Content),
                Status = post.Status.ToString(),
                Author = BuildModerationAuthor(post.AuthorId, authorUser),
                Tags = ParseTags(post.Tags),
                Major = profile?.Major,
                Semester = profile?.Semester,
                CreatedAt = post.CreatedAt,
                ModeratedAt = post.ModeratedAt,
                ModerationNote = post.ModerationNote,
                ModeratorUsername = moderator?.Username
            });
        }

        return dtos;
    }

    private async Task<ModerationPostDetailDto> MapModerationDetailAsync(Post post, CancellationToken cancellationToken)
    {
        var listItem = await MapModerationListItemAsync(post, cancellationToken);

        return new ModerationPostDetailDto
        {
            Id = post.Id,
            Title = post.Title,
            Content = post.Content,
            Excerpt = listItem.Excerpt,
            Status = listItem.Status,
            Author = listItem.Author,
            Tags = listItem.Tags,
            Major = listItem.Major,
            Semester = listItem.Semester,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            ModeratedAt = listItem.ModeratedAt,
            ModerationNote = listItem.ModerationNote,
            ModeratorUsername = listItem.ModeratorUsername
        };
    }

    private async Task<ViolatingUserDto> MapViolatingUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await SyncExpiredBanIfNeededAsync(userId, cancellationToken);
        var violationCount = await _banRepository.CountByUserIdAsync(userId, cancellationToken);
        if (violationCount == 0)
        {
            throw new NotFoundException("ViolatingUser", userId);
        }

        var profile = await _profileRepository.GetByUserIdAsync(userId, cancellationToken);
        var warningCount = await _banRepository.CountByUserIdAndTypeAsync(userId, BanType.Warning, cancellationToken);
        var latestBan = await _banRepository.GetLatestByUserIdAsync(userId, cancellationToken);

        return BuildViolatingUserDto(user, profile, violationCount, warningCount, latestBan);
    }

    private static ViolatingUserDto BuildViolatingUserDto(
        Models.UserAccount user,
        Domain.Entities.UserProfile? profile,
        int violationCount,
        int warningCount,
        UserBan? latestBan)
    {
        var status = ResolveViolationStatus(user, latestBan);
        int? lockDurationDays = null;
        if (IsActiveBan(user) && user.BanUntil.HasValue)
        {
            lockDurationDays = Math.Max(1, (int)Math.Ceiling((user.BanUntil.Value - DateTime.UtcNow).TotalDays));
        }

        return new ViolatingUserDto
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName,
            Email = user.Email,
            Major = profile?.Major,
            Semester = profile?.Semester,
            LevelName = user.LevelName,
            Points = user.Points,
            ViolationCount = violationCount,
            WarningCount = warningCount,
            Status = status,
            BanType = latestBan?.BanType.ToString(),
            BanUntil = user.BanUntil,
            LockDurationDays = lockDurationDays,
            BanReason = latestBan?.Reason ?? user.BanReason,
            LastActionAt = latestBan?.CreatedAt
        };
    }

    private async Task<Models.UserAccount> SyncExpiredBanIfNeededAsync(
        Guid userId, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        if (user.IsBanned && user.BanUntil.HasValue && user.BanUntil <= DateTime.UtcNow)
        {
            await _userRepository.UpdateBanAsync(userId, false, null, null, null, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            user = await _userRepository.GetByIdAsync(userId, cancellationToken) ?? user;
        }

        return user;
    }

    private async Task<ViolationHistoryItemDto> MapViolationHistoryAsync(
        UserBan record, CancellationToken cancellationToken)
    {
        var actor = await _userRepository.GetByIdAsync(record.ActorId, cancellationToken);

        return new ViolationHistoryItemDto
        {
            Id = record.Id,
            BanType = record.BanType.ToString(),
            Reason = record.Reason,
            Until = record.Until,
            CreatedAt = record.CreatedAt,
            ActorUsername = actor?.Username
        };
    }

    private static bool IsActiveBan(Models.UserAccount user) =>
        user.IsBanned && (user.BanUntil is null || user.BanUntil > DateTime.UtcNow);

    private static string ResolveViolationStatus(Models.UserAccount user, UserBan? latestBan)
    {
        if (IsActiveBan(user))
        {
            return "locked";
        }

        if (latestBan?.BanType == BanType.Warning)
        {
            return "warning";
        }

        return "normal";
    }

    private static ModerationAuthorDto BuildModerationAuthor(Guid authorId, Models.UserAccount? user) =>
        new()
        {
            Id = authorId,
            Username = user?.Username ?? "unknown",
            DisplayName = user?.DisplayName ?? "Unknown"
        };

    private void InvalidateModerationStatsCache() => _cache.Remove(ModerationStatsCacheKey);

    private static string BuildExcerpt(string content) =>
        content.Length <= 200 ? content : content[..200] + "...";

    private static IReadOnlyList<string> ParseTags(string tags) =>
        string.IsNullOrWhiteSpace(tags)
            ? []
            : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
