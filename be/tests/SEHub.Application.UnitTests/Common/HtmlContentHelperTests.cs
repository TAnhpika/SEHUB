using SEHub.Application.Common;

namespace SEHub.Application.UnitTests.Common;

public sealed class HtmlContentHelperTests
{
    [Fact]
    public void ToPlainText_StripsTagsAndDecodesEntities()
    {
        var result = HtmlContentHelper.ToPlainText("<p>Hello <strong>world</strong> &amp; friends</p>");

        Assert.Equal("Hello world & friends", result);
    }

    [Fact]
    public void ToPlainText_RemovesScriptPayload()
    {
        var result = HtmlContentHelper.ToPlainText("<script>alert(1)</script>ok");

        Assert.Equal("alert(1) ok", result);
        Assert.DoesNotContain("<script>", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SanitizeRichHtml_RemovesScriptAndEventHandlers()
    {
        var result = HtmlContentHelper.SanitizeRichHtml(
            "<p onclick=\"alert(1)\">Safe</p><script>alert(2)</script><img src=x onerror=alert(3)>");

        Assert.Contains("<p>", result);
        Assert.Contains("Safe", result);
        Assert.DoesNotContain("<script", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onerror", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SanitizeRichHtml_KeepsSafeFormattingAndImages()
    {
        var input =
            "<p>Hello <strong>bold</strong></p><ul><li>One</li></ul>" +
            "<img src=\"https://res.cloudinary.com/demo/image/upload/sample.jpg\" alt=\"demo\">" +
            "<a href=\"https://example.com\">link</a>";

        var result = HtmlContentHelper.SanitizeRichHtml(input);

        Assert.Contains("<strong>", result);
        Assert.Contains("<ul>", result);
        Assert.Contains("<img", result);
        Assert.Contains("https://res.cloudinary.com/demo/image/upload/sample.jpg", result);
        Assert.Contains("<a href=\"https://example.com\"", result);
    }

    [Fact]
    public void SanitizeRichHtml_BlocksJavascriptUrls()
    {
        var result = HtmlContentHelper.SanitizeRichHtml(
            "<a href=\"javascript:alert(1)\">bad</a><img src=\"javascript:alert(2)\">");

        Assert.DoesNotContain("javascript:", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SanitizePostHtml_StripsImagesAndKeepsFormatting()
    {
        var input =
            "<p>Hello <strong>bold</strong></p>" +
            "<img src=\"https://res.cloudinary.com/demo/image/upload/sample.jpg\" alt=\"demo\">" +
            "![md](https://example.com/a.png)" +
            "<a href=\"https://example.com\">link</a>";

        var result = HtmlContentHelper.SanitizePostHtml(input);

        Assert.Contains("<strong>", result);
        Assert.Contains("Hello", result);
        Assert.Contains("<a href=\"https://example.com\"", result);
        Assert.DoesNotContain("<img", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cloudinary.com", result, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("![md]", result, StringComparison.Ordinal);
    }
}
