using System.Text.RegularExpressions;

namespace SEHub.Application.Feed;

internal static partial class PostContentPreview
{
    public static string BuildTextExcerpt(string? content, int maxLength = 200)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return string.Empty;
        }

        var plain = StripHtml(content).Trim();
        if (plain.Length <= maxLength)
        {
            return plain;
        }

        return plain[..maxLength] + "...";
    }

    /// <summary>
    /// Truncated rich content for feed cards (keeps markdown/HTML formatting; images removed).
    /// </summary>
    public static string BuildContentPreview(string? content, int maxLength = 320)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return string.Empty;
        }

        var preview = RemoveImages(content).Trim();
        if (preview.Length <= maxLength)
        {
            return preview;
        }

        return preview[..maxLength].TrimEnd() + "...";
    }

    public static string? ExtractFirstImageUrl(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        var htmlMatch = HtmlImgSrcRegex().Match(content);
        if (htmlMatch.Success)
        {
            return htmlMatch.Groups[1].Value.Trim();
        }

        var markdownMatch = MarkdownImgRegex().Match(content);
        if (markdownMatch.Success)
        {
            return markdownMatch.Groups[1].Value.Trim();
        }

        return null;
    }

    private static string StripHtml(string content)
    {
        var withoutImages = ImgTagRegex().Replace(content, " ");
        var text = HtmlTagRegex().Replace(withoutImages, " ");
        return Regex.Replace(text, @"\s+", " ").Trim();
    }

    private static string RemoveImages(string content)
    {
        var withoutHtmlImages = ImgTagRegex().Replace(content, string.Empty);
        var withoutMarkdownImages = MarkdownImgRegex().Replace(withoutHtmlImages, string.Empty);
        return Regex.Replace(withoutMarkdownImages, @"\n{3,}", "\n\n").Trim();
    }

    [GeneratedRegex(@"<img[^>]+src=[""']([^""']+)[""']", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex HtmlImgSrcRegex();

    [GeneratedRegex(@"!\[[^\]]*\]\(([^)]+)\)", RegexOptions.CultureInvariant)]
    private static partial Regex MarkdownImgRegex();

    [GeneratedRegex(@"<img[^>]*>", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ImgTagRegex();

    [GeneratedRegex(@"<[^>]+>", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlTagRegex();
}
