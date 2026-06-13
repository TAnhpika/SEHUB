namespace SEHub.Contracts.Profiles;

public sealed class ProfileActivityDto
{
    public int TotalActivities { get; init; }
    public IReadOnlyList<ProfileActivityDayDto> Days { get; init; } = [];
}

public sealed class ProfileActivityDayDto
{
    public string Date { get; init; } = string.Empty;
    public int Count { get; init; }
    public int Level { get; init; }
}
