namespace SEHub.Application.Exams;



public sealed class AiTokenLimitSettings
{
    public const string SectionName = "Ai";

    public string Provider { get; set; } = "Mock";

    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "gemini-2.0-flash";

    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta";

    public int DailyTokenLimitFree { get; set; } = 10;

    public int DailyTokenLimitPremium { get; set; } = 1000;

    public int TokenCostExplain { get; set; } = 10;

    public int TokenCostChat { get; set; } = 10;
}

