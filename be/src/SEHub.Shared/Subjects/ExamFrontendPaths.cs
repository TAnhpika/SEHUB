namespace SEHub.Shared.Subjects;

public static class ExamFrontendPaths
{
    public static string BuildPracticeExamDetailPath(string subjectCode, string? paperCode = null)
    {
        var normalizedSubject = subjectCode.Trim();
        if (string.IsNullOrWhiteSpace(normalizedSubject))
        {
            return "/home/practical-exam";
        }

        var subjectSegment = Uri.EscapeDataString(normalizedSubject);
        if (string.IsNullOrWhiteSpace(paperCode))
        {
            return $"/home/practical-exam/{subjectSegment}";
        }

        return $"/home/practical-exam/{subjectSegment}/{Uri.EscapeDataString(paperCode.Trim())}";
    }
}
