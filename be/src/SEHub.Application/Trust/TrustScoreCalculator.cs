using Microsoft.Extensions.Options;
using SEHub.Application.Trust.Models;
using SEHub.Contracts.Trust;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.Application.Trust;

public sealed class TrustScoreCalculator
{
    private readonly TrustScoreOptions _options;

    public TrustScoreCalculator(IOptions<TrustScoreOptions> options)
    {
        _options = options.Value;
    }

    public TrustScoreDto Compute(TrustScoreSignals signals, DateTime utcNow)
    {
        if (IsStaff(signals.Role))
        {
            return BuildResult(100, 100, 100, 100, "high", "high", utcNow);
        }

        if (IsPermanentlyBanned(signals))
        {
            return BuildResult(0, 0, 0, 0, "low", ResolveConfidence(signals, utcNow), utcNow);
        }

        var conductDelta = ComputeConductDelta(signals);
        var competenceBonus = ComputeCompetenceBonus(signals);
        var engagementBonus = ComputeEngagementBonus(signals, utcNow);
        var tenureBonus = ComputeTenureBonus(signals, utcNow);

        var rawScore = _options.BaseScore + conductDelta + competenceBonus + engagementBonus + tenureBonus;
        var score = Clamp(0, 100, (int)Math.Round(rawScore));

        if (HasActiveTempBan(signals, utcNow))
        {
            score = Math.Min(score, _options.ActiveTempBanCap);
        }

        var conductScore = Clamp(0, 100, 100 + (int)Math.Round(conductDelta));
        var competenceScore = NormalizeBonus(competenceBonus, _options.CompetenceBonusCap);
        var engagementScore = NormalizeBonus(engagementBonus, _options.EngagementBonusCap);
        var tier = ResolveTier(score);
        var confidence = ResolveConfidence(signals, utcNow);

        return BuildResult(score, conductScore, competenceScore, engagementScore, tier, confidence, utcNow);
    }

    public static TrustScorePublicDto ToPublic(TrustScoreDto dto) => new()
    {
        Score = dto.Score,
        Tier = dto.Tier,
    };

    private double ComputeConductDelta(TrustScoreSignals signals)
    {
        var delta = 0d;

        foreach (var row in signals.ReportPenalties)
        {
            if (row.Status == ReportStatus.Rejected)
            {
                continue;
            }

            var reasonId = TrustReasonClassifier.Classify(row.ReasonId);
            if (!_options.ReasonPenalties.TryGetValue(reasonId, out var penalty))
            {
                penalty = _options.ReasonPenalties.GetValueOrDefault("other", 3);
            }

            var multiplier = row.Status == ReportStatus.Pending
                ? _options.PendingReportMultiplier
                : 1d;

            delta -= penalty * row.Count * multiplier;
        }

        delta -= signals.WarningCount * _options.WarningPenalty;
        delta -= signals.TempBanCount * _options.TempBanPenalty;

        return delta;
    }

    private double ComputeCompetenceBonus(TrustScoreSignals signals)
    {
        var levelBonus = 0;
        if (!string.IsNullOrWhiteSpace(signals.LevelName)
            && _options.LevelBonuses.TryGetValue(signals.LevelName, out var configured))
        {
            levelBonus = configured;
        }

        var pointsBonus = Math.Min(8d, Math.Log10(Math.Max(0, signals.Points) + 1) * 3);
        var examsBonus = Math.Min(8d, signals.ExamsCompleted * 0.4);
        var highScoreBonus = Math.Min(6d, signals.HighScoreExams * 0.8);
        var practiceBonus = Math.Min(4d, signals.PracticePassed * 1.5);
        var badgesBonus = Math.Min(4d, signals.BadgesCount * 0.8);

        return Math.Min(
            _options.CompetenceBonusCap,
            levelBonus + pointsBonus + examsBonus + highScoreBonus + practiceBonus + badgesBonus);
    }

    private double ComputeEngagementBonus(TrustScoreSignals signals, DateTime utcNow)
    {
        var streakBonus = Math.Min(8d, signals.StreakCount * 0.4);
        var highestStreakBonus = Math.Min(4d, signals.HighestStreak * 0.15);
        var likesBonus = Math.Min(6d, signals.LikesReceived * 0.05);
        var socialBonus = Math.Min(4d, (signals.PostsCount + signals.CommentsCount) * 0.15);
        var recentActivityBonus = IsRecentlyActive(signals, utcNow) ? _options.RecentActivityBonus : 0;

        return Math.Min(
            _options.EngagementBonusCap,
            streakBonus + highestStreakBonus + likesBonus + socialBonus + recentActivityBonus);
    }

    private double ComputeTenureBonus(TrustScoreSignals signals, DateTime utcNow)
    {
        var accountAgeDays = Math.Max(0, (utcNow - signals.CreatedAt).TotalDays);
        var ageBonus = Math.Min(6d, accountAgeDays / 60d);
        var emailBonus = signals.EmailConfirmed ? _options.EmailVerifiedBonus : 0;

        return Math.Min(_options.TenureBonusCap, ageBonus + emailBonus);
    }

    private int CountPositiveSignals(TrustScoreSignals signals)
    {
        var count = 0;
        if (signals.PostsCount > 0) count++;
        if (signals.CommentsCount > 0) count++;
        if (signals.ExamsCompleted > 0) count++;
        if (signals.PracticePassed > 0) count++;
        if (signals.BadgesCount > 0) count++;
        if (signals.LikesReceived > 0) count++;
        if (signals.StreakCount > 0) count++;
        if (signals.Points > 0) count++;
        return count;
    }

    private string ResolveConfidence(TrustScoreSignals signals, DateTime utcNow)
    {
        var accountAgeDays = (utcNow - signals.CreatedAt).TotalDays;
        var positiveSignals = CountPositiveSignals(signals);

        if (accountAgeDays < _options.ColdStartDays
            && positiveSignals < _options.ColdStartMinPositiveSignals)
        {
            return "low";
        }

        if (accountAgeDays < 30 || positiveSignals < 8)
        {
            return "medium";
        }

        return "high";
    }

    private string ResolveTier(int score)
    {
        if (score >= _options.HighTierMinScore)
        {
            return "high";
        }

        if (score <= _options.LowTierMaxScore)
        {
            return "low";
        }

        return "medium";
    }

    private static bool IsStaff(string role) =>
        string.Equals(role, RoleNames.Admin, StringComparison.OrdinalIgnoreCase)
        || string.Equals(role, RoleNames.Moderator, StringComparison.OrdinalIgnoreCase);

    private static bool IsPermanentlyBanned(TrustScoreSignals signals) =>
        signals.ActiveBanType == BanType.Permanent
        || (signals.IsBanned && signals.BanUntil is null);

    private static bool HasActiveTempBan(TrustScoreSignals signals, DateTime utcNow) =>
        signals.IsBanned
        && signals.BanUntil is DateTime until
        && until > utcNow;

    private bool IsRecentlyActive(TrustScoreSignals signals, DateTime utcNow) =>
        signals.LastActivityDate is DateTime last
        && (utcNow - last).TotalDays <= _options.RecentActivityDays;

    private static int NormalizeBonus(double bonus, int cap)
    {
        if (cap <= 0)
        {
            return 0;
        }

        return Clamp(0, 100, (int)Math.Round(bonus / cap * 100));
    }

    private static int Clamp(int min, int max, int value) => Math.Min(max, Math.Max(min, value));

    private static TrustScoreDto BuildResult(
        int score,
        int conductScore,
        int competenceScore,
        int engagementScore,
        string tier,
        string confidence,
        DateTime utcNow) => new()
    {
        Score = score,
        Tier = tier,
        ConductScore = conductScore,
        CompetenceScore = competenceScore,
        EngagementScore = engagementScore,
        Confidence = confidence,
        ComputedAt = utcNow,
    };
}
