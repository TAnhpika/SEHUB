using System.Text.Json;
using System.Text.Json.Serialization;

namespace SEHub.Application.Gamification;

public sealed class BadgeCondition
{
    [JsonPropertyName("triggerType")]
    public string TriggerType { get; init; } = string.Empty;

    [JsonPropertyName("triggerValue")]
    public int TriggerValue { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("minScore")]
    public int? MinScore { get; init; }

    public static BadgeCondition? TryParse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<BadgeCondition>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
