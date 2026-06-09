namespace SEHub.Contracts.Exams;

public sealed class ExamResultDto
{
    public decimal Score { get; init; }
    public int TotalQuestions { get; init; }
    public int CorrectCount { get; init; }
    public IReadOnlyList<ExamResultAnswerDto> Answers { get; init; } = [];
}

public sealed class ExamResultAnswerDto
{
    public Guid QuestionId { get; init; }
    public Guid? SelectedOptionId { get; init; }
    public Guid? CorrectOptionId { get; init; }
    public bool IsCorrect { get; init; }
}
