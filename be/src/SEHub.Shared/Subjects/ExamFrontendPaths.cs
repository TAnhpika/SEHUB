namespace SEHub.Shared.Subjects;

public static class ExamFrontendPaths
{
    public static string BuildPracticeExamDetailPath(string examCode, string? title = null, string? major = null)
    {
        var courseCode = SubjectCodeResolver.Resolve(examCode, title, major)
            ?? major?.Trim();

        if (string.IsNullOrWhiteSpace(courseCode))
        {
            courseCode = "SUBJECT";
        }

        return $"/home/practical-exam/{Uri.EscapeDataString(courseCode)}/{Uri.EscapeDataString(examCode)}";
    }
}
