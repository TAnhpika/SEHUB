namespace SEHub.Application.Gamification;

public sealed class GamificationSettings
{
    public const string SectionName = "Gamification";
    public bool UseEngine { get; set; } = true;
    public bool UseRedisCache { get; set; } = false;
}
