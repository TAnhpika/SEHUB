namespace SEHub.Contracts.Exams;

public sealed class ExamQueryParams
{
    public string? Code { get; init; }
    public string? Type { get; init; }
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public string? Status { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public Guid? SubmittedById { get; init; }
    public bool IncludeUnpublished { get; init; }
    public bool Mine { get; init; }
}
