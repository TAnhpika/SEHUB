namespace SEHub.Contracts.Subjects;

public sealed class SubjectDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int Semester { get; init; }
    public string Major { get; init; } = string.Empty;
}
