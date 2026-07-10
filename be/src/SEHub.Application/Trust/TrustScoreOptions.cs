namespace SEHub.Application.Trust;

public sealed class TrustScoreOptions
{
    public const string SectionName = "TrustScore";

    public int BaseScore { get; set; } = 70;
    public int ActiveTempBanCap { get; set; } = 25;
    public double PendingReportMultiplier { get; set; } = 0.25;
    public int CompetenceBonusCap { get; set; } = 25;
    public int EngagementBonusCap { get; set; } = 20;
    public int TenureBonusCap { get; set; } = 8;
    public int ColdStartDays { get; set; } = 7;
    public int ColdStartMinPositiveSignals { get; set; } = 3;
    public int RecentActivityDays { get; set; } = 30;
    public int RecentActivityBonus { get; set; } = 2;
    public int EmailVerifiedBonus { get; set; } = 2;
    public decimal HighScoreThreshold { get; set; } = 80m;
    public int HighTierMinScore { get; set; } = 80;
    public int LowTierMaxScore { get; set; } = 49;

    public Dictionary<string, int> ReasonPenalties { get; set; } = new(StringComparer.OrdinalIgnoreCase)
    {
        ["spam"] = 8,
        ["harassment"] = 12,
        ["misinformation"] = 6,
        ["inappropriate"] = 5,
        ["copyright"] = 4,
        ["other"] = 3,
    };

    public int WarningPenalty { get; set; } = 5;
    public int TempBanPenalty { get; set; } = 15;

    public Dictionary<string, int> LevelBonuses { get; set; } = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Bronze"] = 0,
        ["Silver"] = 3,
        ["Gold"] = 6,
        ["Platinum"] = 10,
        ["Diamond"] = 12,
    };
}
