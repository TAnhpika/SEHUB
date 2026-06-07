namespace SEHub.Contracts.Exams;

public sealed class ExamQueryParams
{
    public string? Type { get; init; }
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
