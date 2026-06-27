using System.Text.RegularExpressions;

namespace SEHub.Shared.Subjects;

public static partial class SubjectCodeResolver
{
    [GeneratedRegex(@"[A-Za-z]{3}\d{3}[cC]?", RegexOptions.Compiled)]
    private static partial Regex CourseCodePattern();

    public static string? Resolve(params string?[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (string.IsNullOrWhiteSpace(candidate))
            {
                continue;
            }

            var match = CourseCodePattern().Match(candidate.Trim());
            if (!match.Success)
            {
                continue;
            }

            var raw = match.Value;
            var letters = raw[..3].ToUpperInvariant();
            var digits = raw[3..6];
            var hasLowerC = raw.Length > 6 && raw[6] is 'c';
            return letters + digits + (hasLowerC ? "c" : "");
        }

        return null;
    }
}
