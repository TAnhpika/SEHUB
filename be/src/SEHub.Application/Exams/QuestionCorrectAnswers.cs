using System.Text.Json;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Exams;

public static class QuestionCorrectAnswers
{
    public static IReadOnlyList<Guid> GetCorrectOptionIds(Question question)
    {
        if (question.QuestionType == QuestionType.MultiSelect
            && !string.IsNullOrWhiteSpace(question.CorrectOptionIdsJson))
        {
            try
            {
                return JsonSerializer.Deserialize<List<Guid>>(question.CorrectOptionIdsJson) ?? [];
            }
            catch
            {
                return [];
            }
        }

        return question.CorrectOptionId.HasValue
            ? [question.CorrectOptionId.Value]
            : [];
    }

    public static string SerializeCorrectOptionIds(IEnumerable<Guid> optionIds) =>
        JsonSerializer.Serialize(optionIds.Distinct().ToList());

    public static int GetRequiredSelectCount(Question question)
    {
        if (question.RequiredSelectCount is > 0)
        {
            return question.RequiredSelectCount.Value;
        }

        return GetCorrectOptionIds(question).Count;
    }
}
