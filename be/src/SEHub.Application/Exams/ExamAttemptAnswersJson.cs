using System.Text.Json;

namespace SEHub.Application.Exams;

public static class ExamAttemptAnswersJson
{
    public static string Serialize(IReadOnlyDictionary<Guid, IReadOnlyList<Guid>> answers)
    {
        var payload = answers.ToDictionary(
            pair => pair.Key.ToString(),
            pair => pair.Value.Distinct().ToList());

        return JsonSerializer.Serialize(payload);
    }

    public static Dictionary<Guid, List<Guid>> Deserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        using var document = JsonDocument.Parse(json);
        if (document.RootElement.ValueKind != JsonValueKind.Object)
        {
            return [];
        }

        var result = new Dictionary<Guid, List<Guid>>();

        foreach (var property in document.RootElement.EnumerateObject())
        {
            if (!Guid.TryParse(property.Name, out var questionId))
            {
                continue;
            }

            result[questionId] = ParseAnswerValue(property.Value);
        }

        return result;
    }

    private static List<Guid> ParseAnswerValue(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.Array)
        {
            return value.EnumerateArray()
                .Select(item => item.GetString())
                .Where(item => Guid.TryParse(item, out _))
                .Select(Guid.Parse!)
                .Distinct()
                .ToList();
        }

        if (value.ValueKind == JsonValueKind.String
            && Guid.TryParse(value.GetString(), out var optionId))
        {
            return [optionId];
        }

        return [];
    }
}
