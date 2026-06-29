using System.Text.RegularExpressions;

namespace SEHub.Shared.Feed;

public static class TagSlug
{
    public static string NormalizeTagName(string? value) =>
        value?.Trim().TrimStart('#') ?? string.Empty;

    public static string ToSlug(string name)
    {
        var normalized = NormalizeTagName(name);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return "tag";
        }

        var lower = normalized.ToLowerInvariant();
        var slug = Regex.Replace(lower, @"[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(slug) ? "tag" : slug;
    }
}
