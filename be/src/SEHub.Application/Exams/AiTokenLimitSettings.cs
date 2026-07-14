namespace SEHub.Application.Exams;



public sealed class AiTokenLimitSettings
{
    public const string SectionName = "Ai";

    public string Provider { get; set; } = "Mock";

    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "nex-agi/nex-n2-pro:free";

    public string BaseUrl { get; set; } = "https://openrouter.ai/api/v1";

    public string HttpReferer { get; set; } = "http://localhost:5173";

    public string SiteTitle { get; set; } = "SEHub";

    public int DailyTokenLimitFree { get; set; } = 10;

    public int DailyTokenLimitPremium { get; set; } = 1000;

    public int TokenCostExplain { get; set; } = 10;

    public int TokenCostChat { get; set; } = 10;

    public int RequestTimeoutSeconds { get; set; } = 120;

    public int MaxTokens { get; set; } = 2048;
}

