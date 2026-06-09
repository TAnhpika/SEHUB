namespace SEHub.Application.Exams;



public sealed class AiTokenLimitSettings

{

    public const string SectionName = "Ai";



    public int DailyTokenLimitFree { get; set; } = 10;

    public int DailyTokenLimitPremium { get; set; } = 1000;

}

