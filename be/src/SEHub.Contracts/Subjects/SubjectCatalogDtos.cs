namespace SEHub.Contracts.Subjects;

public sealed class SubjectCourseDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Major { get; init; } = string.Empty;
}

public sealed class SubjectSemesterGroupDto
{
    public int Semester { get; init; }
    public IReadOnlyList<SubjectCourseDto> Courses { get; init; } = [];
}

public sealed class SubjectSourceEntryDto
{
    public string Code { get; init; } = string.Empty;
    public int Semester { get; init; }
    public string Major { get; init; } = string.Empty;
}
