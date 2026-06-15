namespace SEHub.Contracts.Profiles;

public sealed class AiTokenStatusDto
{
    public int Limit { get; init; }
    public int Used { get; init; }
    public int Remaining { get; init; }
    public int CostExplain { get; init; }
    public int CostChat { get; init; }
    public bool CanExplain { get; init; }
    public bool CanChat { get; init; }
}
