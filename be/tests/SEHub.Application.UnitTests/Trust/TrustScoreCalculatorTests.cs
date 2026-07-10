using FluentAssertions;
using Microsoft.Extensions.Options;
using SEHub.Application.Trust;
using SEHub.Application.Trust.Models;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.Application.UnitTests.Trust;

public sealed class TrustScoreCalculatorTests
{
    private static readonly DateTime UtcNow = new(2026, 7, 10, 0, 0, 0, DateTimeKind.Utc);

    private readonly TrustScoreCalculator _calculator = new(
        Options.Create(new TrustScoreOptions()));

    [Fact]
    public void Compute_StaffUser_ReturnsPerfectScore()
    {
        var result = _calculator.Compute(new TrustScoreSignals { Role = RoleNames.Moderator }, UtcNow);

        result.Score.Should().Be(100);
        result.Tier.Should().Be("high");
    }

    [Fact]
    public void Compute_NewCleanStudent_ReturnsAroundBaseScore()
    {
        var result = _calculator.Compute(new TrustScoreSignals
        {
            Role = RoleNames.Student,
            CreatedAt = UtcNow.AddDays(-1),
            EmailConfirmed = true,
        }, UtcNow);

        result.Score.Should().BeInRange(70, 82);
        result.Confidence.Should().Be("low");
    }

    [Fact]
    public void Compute_SpamReports_LowersScore()
    {
        var result = _calculator.Compute(new TrustScoreSignals
        {
            Role = RoleNames.Student,
            CreatedAt = UtcNow.AddMonths(-3),
            EmailConfirmed = true,
            ExamsCompleted = 5,
            Points = 200,
            ReportPenalties =
            [
                new TrustReportPenaltyRow
                {
                    ReasonId = "spam",
                    Status = ReportStatus.Approved,
                    Count = 3,
                },
            ],
        }, UtcNow);

        result.Score.Should().BeLessThan(60);
        result.ConductScore.Should().BeLessThan(80);
    }

    [Fact]
    public void Compute_PermanentBan_ReturnsZero()
    {
        var result = _calculator.Compute(new TrustScoreSignals
        {
            Role = RoleNames.Student,
            IsBanned = true,
            BanUntil = null,
            ActiveBanType = BanType.Permanent,
            CreatedAt = UtcNow.AddYears(-1),
        }, UtcNow);

        result.Score.Should().Be(0);
        result.Tier.Should().Be("low");
    }

    [Fact]
    public void Compute_ActiveTempBan_CapsScore()
    {
        var result = _calculator.Compute(new TrustScoreSignals
        {
            Role = RoleNames.Student,
            IsBanned = true,
            BanUntil = UtcNow.AddDays(7),
            ActiveBanType = BanType.Temp,
            CreatedAt = UtcNow.AddYears(-1),
            Points = 500,
            ExamsCompleted = 10,
            StreakCount = 14,
            EmailConfirmed = true,
        }, UtcNow);

        result.Score.Should().BeLessThanOrEqualTo(25);
    }

    [Fact]
    public void Compute_HighEngagementAndCompetence_RaisesScore()
    {
        var result = _calculator.Compute(new TrustScoreSignals
        {
            Role = RoleNames.Student,
            CreatedAt = UtcNow.AddMonths(-8),
            EmailConfirmed = true,
            LevelName = "Gold",
            Points = 800,
            StreakCount = 20,
            HighestStreak = 30,
            BadgesCount = 4,
            PostsCount = 12,
            CommentsCount = 20,
            LikesReceived = 80,
            ExamsCompleted = 15,
            HighScoreExams = 8,
            PracticePassed = 3,
            LastActivityDate = UtcNow.AddDays(-2),
        }, UtcNow);

        result.Score.Should().BeGreaterThanOrEqualTo(85);
        result.Tier.Should().Be("high");
        result.CompetenceScore.Should().BeGreaterThan(50);
        result.EngagementScore.Should().BeGreaterThan(50);
    }

    [Fact]
    public void ClassifyReason_MapsVietnameseSpamText()
    {
        TrustReasonClassifier.Classify("Spam hoặc quảng cáo").Should().Be("spam");
        TrustReasonClassifier.Classify("Quấy rối trong nhóm").Should().Be("harassment");
    }
}
