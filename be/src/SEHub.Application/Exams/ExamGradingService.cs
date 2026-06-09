using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;

namespace SEHub.Application.Exams;

public sealed class ExamGradingService : IExamGradingService
{
    public ExamResultDto Grade(Exam exam, IReadOnlyDictionary<Guid, Guid> answers)
    {
        var questions = exam.Questions.OrderBy(q => q.OrderIndex).ToList();
        var resultAnswers = new List<ExamResultAnswerDto>();
        var correctCount = 0;

        foreach (var question in questions)
        {
            answers.TryGetValue(question.Id, out var selectedOptionId);
            var isCorrect = question.CorrectOptionId.HasValue && selectedOptionId == question.CorrectOptionId;

            if (isCorrect)
            {
                correctCount++;
            }

            resultAnswers.Add(new ExamResultAnswerDto
            {
                QuestionId = question.Id,
                SelectedOptionId = selectedOptionId == default ? null : selectedOptionId,
                CorrectOptionId = question.CorrectOptionId,
                IsCorrect = isCorrect
            });
        }

        var total = questions.Count;
        var score = total == 0 ? 0 : Math.Round((decimal)correctCount / total * 100, 2);

        return new ExamResultDto
        {
            Score = score,
            TotalQuestions = total,
            CorrectCount = correctCount,
            Answers = resultAnswers
        };
    }
}
