namespace SEHub.Contracts.Trust;

public sealed class TrustScoreDto
{
    public int Score { get; init; }
    public string Tier { get; init; } = "medium";
    public int ConductScore { get; init; }
    public int CompetenceScore { get; init; }
    public int EngagementScore { get; init; }
    public string Confidence { get; init; } = "medium";
    public DateTime ComputedAt { get; init; }
}

public sealed class TrustScorePublicDto
{
    public int Score { get; init; }
    public string Tier { get; init; } = "medium";
}
