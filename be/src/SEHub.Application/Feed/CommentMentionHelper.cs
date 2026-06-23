using System.Text.RegularExpressions;

namespace SEHub.Application.Feed;

public static class CommentMentionHelper
{
    private static readonly Regex MentionRegex = new(@"@([a-zA-Z0-9_\.]+)", RegexOptions.Compiled);
    private static readonly Regex HtmlTagRegex = new("<[^>]+>", RegexOptions.Compiled);

    public static IReadOnlyList<string> ExtractUsernames(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return [];
        }

        var plainText = HtmlTagRegex.Replace(content, " ");
        return MentionRegex.Matches(plainText)
            .Select(match => match.Groups[1].Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static string EnsureReplyMention(string content, string parentUsername)
    {
        var mention = $"@{parentUsername}";
        if (content.Contains(mention, StringComparison.OrdinalIgnoreCase))
        {
            return content;
        }

        var trimmed = content.TrimStart();
        return string.IsNullOrEmpty(trimmed) ? mention : $"{mention} {trimmed}";
    }
}
