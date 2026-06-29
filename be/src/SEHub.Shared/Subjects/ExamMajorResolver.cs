namespace SEHub.Shared.Subjects;

public static class ExamMajorResolver
{
    private static readonly HashSet<string> ValidMajors = new(StringComparer.OrdinalIgnoreCase) { "SE", "AI" };

    public static string Normalize(string? major, params string?[] subjectCandidates)
    {
        var trimmed = major?.Trim() ?? string.Empty;
        if (ValidMajors.Contains(trimmed))
        {
            return trimmed.ToUpperInvariant();
        }

        var subjectCode = SubjectCodeResolver.Resolve(trimmed);
        var majorIsSubjectCode = subjectCode is not null
            && string.Equals(subjectCode, trimmed, StringComparison.OrdinalIgnoreCase);

        if (!majorIsSubjectCode)
        {
            subjectCode = SubjectCodeResolver.Resolve(subjectCandidates);
        }

        if (subjectCode is null)
        {
            return string.IsNullOrWhiteSpace(trimmed) ? "SE" : trimmed;
        }

        return InferFromSubjectCode(subjectCode);
    }

    private static string InferFromSubjectCode(string subjectCode)
    {
        var upper = subjectCode.ToUpperInvariant();
        if (upper.StartsWith("CSI", StringComparison.Ordinal)
            || upper.StartsWith("CSD", StringComparison.Ordinal)
            || upper.StartsWith("AIG", StringComparison.Ordinal))
        {
            return "AI";
        }

        return "SE";
    }
}
