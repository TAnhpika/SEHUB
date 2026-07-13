namespace SEHub.Contracts.Exams;

public sealed class QuestionImageDto
{
    public Guid Id { get; init; }
    public int SortOrder { get; init; }
    public string ImagePath { get; init; } = string.Empty;
}
