using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Trust.Models;
using SEHub.Application.Users;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class TrustSignalReadRepository : ITrustSignalReadRepository
{
    private readonly SEHubDbContext _context;
    private readonly IUserBanRepository _banRepository;
    private readonly IUserBadgeRepository _badgeRepository;
    private readonly IPostRepository _postRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly IExamAttemptRepository _examAttemptRepository;
    private readonly IBanStatusService _banStatusService;

    public TrustSignalReadRepository(
        SEHubDbContext context,
        IUserBanRepository banRepository,
        IUserBadgeRepository badgeRepository,
        IPostRepository postRepository,
        ICommentRepository commentRepository,
        IExamAttemptRepository examAttemptRepository,
        IBanStatusService banStatusService)
    {
        _context = context;
        _banRepository = banRepository;
        _badgeRepository = badgeRepository;
        _postRepository = postRepository;
        _commentRepository = commentRepository;
        _examAttemptRepository = examAttemptRepository;
        _banStatusService = banStatusService;
    }

    public async Task<TrustScoreSignals> GetSignalsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Level)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException($"User {userId} was not found.");
        }

        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Join(_context.Roles, ur => ur.RoleId, role => role.Id, (_, role) => role.Name)
            .ToListAsync(cancellationToken);

        var role = roles.FirstOrDefault() ?? string.Empty;
        var activeBan = await _banStatusService.GetActiveBanAsync(userId, cancellationToken);
        var profileCreatedAt = await _context.UserProfiles
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => (DateTime?)p.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var reportPenalties = await GetReportPenaltiesAsync(userId, cancellationToken);
        var likesReceived = await CountLikesReceivedAsync(userId, cancellationToken);
        var practicePassed = await _context.PracticeSubmissions.CountAsync(
            s => s.UserId == userId && s.IsLatest && s.Status == PracticeSubmissionStatus.Passed,
            cancellationToken);

        return new TrustScoreSignals
        {
            Role = role,
            IsBanned = user.IsBanned,
            BanUntil = user.BanUntil,
            ActiveBanType = activeBan?.BanType,
            Points = user.Points,
            LevelName = user.Level?.Name,
            StreakCount = user.StreakCount,
            HighestStreak = user.HighestStreak,
            BadgesCount = await _badgeRepository.CountByUserIdAsync(userId, cancellationToken),
            PostsCount = await _postRepository.CountByAuthorIdAsync(userId, cancellationToken),
            CommentsCount = await _commentRepository.CountByAuthorIdAsync(userId, cancellationToken),
            LikesReceived = likesReceived,
            ExamsCompleted = await _examAttemptRepository.CountSubmittedByUserIdAsync(userId, cancellationToken),
            HighScoreExams = await _examAttemptRepository.CountSubmittedWithMinScoreAsync(
                userId, 80m, cancellationToken),
            PracticePassed = practicePassed,
            WarningCount = await _banRepository.CountByUserIdAndTypeAsync(userId, BanType.Warning, cancellationToken),
            TempBanCount = await _banRepository.CountByUserIdAndTypeAsync(userId, BanType.Temp, cancellationToken),
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = profileCreatedAt ?? DateTime.UtcNow,
            LastActivityDate = user.LastActivityDate,
            ReportPenalties = reportPenalties,
        };
    }

    private async Task<IReadOnlyList<TrustReportPenaltyRow>> GetReportPenaltiesAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var postRows = await (
            from report in _context.PostReports.AsNoTracking()
            join post in _context.Posts.AsNoTracking() on report.PostId equals post.Id
            where post.AuthorId == userId
            group report by new { report.Reason, report.Status } into g
            select new TrustReportPenaltyRow
            {
                ReasonId = g.Key.Reason,
                Status = g.Key.Status,
                Count = g.Count(),
            }).ToListAsync(cancellationToken);

        var userRows = await _context.UserReports
            .AsNoTracking()
            .Where(r => r.ReportedUserId == userId)
            .GroupBy(r => new { r.Reason, r.Status })
            .Select(g => new TrustReportPenaltyRow
            {
                ReasonId = g.Key.Reason,
                Status = g.Key.Status,
                Count = g.Count(),
            })
            .ToListAsync(cancellationToken);

        var conversationRows = await (
            from report in _context.ConversationReports.AsNoTracking()
            join participant in _context.ConversationParticipants.AsNoTracking()
                on report.ConversationId equals participant.ConversationId
            where participant.UserId == userId && report.ReporterId != userId
            group report by new { report.Reason, report.Status } into g
            select new TrustReportPenaltyRow
            {
                ReasonId = g.Key.Reason,
                Status = g.Key.Status,
                Count = g.Count(),
            }).ToListAsync(cancellationToken);

        return postRows.Concat(userRows).Concat(conversationRows).ToList();
    }

    private Task<int> CountLikesReceivedAsync(Guid userId, CancellationToken cancellationToken) =>
        (from like in _context.PostLikes.AsNoTracking()
         join post in _context.Posts.AsNoTracking() on like.PostId equals post.Id
         where post.AuthorId == userId
         select like).CountAsync(cancellationToken);
}
