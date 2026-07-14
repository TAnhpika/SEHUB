using System.Net;
using System.Text.RegularExpressions;
using Ganss.Xss;

namespace SEHub.Application.Common;

/// <summary>
/// Plain-text strip vs rich HTML whitelist sanitize for user/staff content fields.
/// </summary>
public static partial class HtmlContentHelper
{
    private static readonly HtmlSanitizer RichSanitizer = CreateRichSanitizer(allowImages: true);
    private static readonly HtmlSanitizer PostSanitizer = CreateRichSanitizer(allowImages: false);

    /// <summary>Strip all HTML tags and decode entities to plain text (whitespace collapsed).</summary>
    public static string ToPlainText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var withoutTags = HtmlTagRegex().Replace(value, " ");
        var decoded = WebUtility.HtmlDecode(withoutTags);
        return WhitespaceRegex().Replace(decoded, " ").Trim();
    }

    /// <summary>
    /// Keep newlines for chat-like plain fields; still remove tags and collapse horizontal space.
    /// </summary>
    public static string ToPlainTextPreserveNewlines(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var withoutTags = HtmlTagRegex().Replace(value, " ");
        var decoded = WebUtility.HtmlDecode(withoutTags);
        var normalized = Regex.Replace(decoded, @"[^\S\r\n]+", " ");
        normalized = Regex.Replace(normalized, @"\n{3,}", "\n\n");
        return normalized.Trim();
    }

    /// <summary>Sanitize rich HTML for questions/exams (safe tags including img).</summary>
    public static string SanitizeRichHtml(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return RichSanitizer.Sanitize(value).Trim();
    }

    /// <summary>Sanitize post body HTML — images belong in PostImages, not Content.</summary>
    public static string SanitizePostHtml(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var withoutImages = ImgTagRegex().Replace(value, string.Empty);
        withoutImages = MarkdownImgRegex().Replace(withoutImages, string.Empty);
        return PostSanitizer.Sanitize(withoutImages).Trim();
    }

    private static HtmlSanitizer CreateRichSanitizer(bool allowImages)
    {
        var sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Clear();
        var tags = new List<string>
        {
            "p", "br", "strong", "b", "em", "i", "u", "s", "del", "mark",
            "ul", "ol", "li", "blockquote",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "a", "code", "pre", "span", "div",
            "table", "thead", "tbody", "tr", "th", "td", "hr",
        };
        if (allowImages)
        {
            tags.Add("img");
        }

        foreach (var tag in tags)
        {
            sanitizer.AllowedTags.Add(tag);
        }

        sanitizer.AllowedAttributes.Clear();
        foreach (var attr in new[] { "href", "src", "alt", "title", "target", "rel" })
        {
            sanitizer.AllowedAttributes.Add(attr);
        }

        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.Add("http");
        sanitizer.AllowedSchemes.Add("https");
        sanitizer.AllowedSchemes.Add("mailto");

        sanitizer.AllowedCssProperties.Clear();
        return sanitizer;
    }

    [GeneratedRegex(@"<[^>]+>", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlTagRegex();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex WhitespaceRegex();

    [GeneratedRegex(@"<img\b[^>]*/?>", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ImgTagRegex();

    [GeneratedRegex(@"!\[[^\]]*\]\([^)]*\)", RegexOptions.CultureInvariant)]
    private static partial Regex MarkdownImgRegex();
}
