using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Exams;

public sealed class ExamGradingService : IExamGradingService
{
    public ExamResultDto Grade(Exam exam, IReadOnlyDictionary<Guid, List<Guid>> answers)
    {
        var questions = exam.Questions.OrderBy(q => q.OrderIndex).ToList();
        var resultAnswers = new List<ExamResultAnswerDto>();
        var correctCount = 0;

        foreach (var question in questions)
        {
            answers.TryGetValue(question.Id, out var selectedOptionIds);
            selectedOptionIds ??= [];

            var correctOptionIds = QuestionCorrectAnswers.GetCorrectOptionIds(question);
            var isCorrect = IsAnswerCorrect(question.QuestionType, selectedOptionIds, correctOptionIds);

            if (isCorrect)
            {
                correctCount++;
            }

            resultAnswers.Add(new ExamResultAnswerDto
            {
                QuestionId = question.Id,
                SelectedOptionIds = selectedOptionIds,
                CorrectOptionIds = correctOptionIds,
                IsCorrect = isCorrect,
            });
        }

        var total = questions.Count;
        var score = total == 0 ? 0 : Math.Round((decimal)correctCount / total * 100, 2);

        return new ExamResultDto
        {
            Score = score,
            TotalQuestions = total,
            CorrectCount = correctCount,
            Answers = resultAnswers,
        };
    }

    internal static bool IsAnswerCorrect(
        QuestionType questionType,
        IReadOnlyList<Guid> selectedOptionIds,
        IReadOnlyList<Guid> correctOptionIds)
    {
        var selected = selectedOptionIds.Where(id => id != Guid.Empty).Distinct().OrderBy(id => id).ToList();
        var correct = correctOptionIds.Where(id => id != Guid.Empty).Distinct().OrderBy(id => id).ToList();

        if (correct.Count == 0)
        {
            return false;
        }

        if (questionType == QuestionType.MultiSelect)
        {
            return selected.Count == correct.Count
                && selected.SequenceEqual(correct);
        }

        return selected.Count == 1 && correct.Count == 1 && selected[0] == correct[0];
    }
}
