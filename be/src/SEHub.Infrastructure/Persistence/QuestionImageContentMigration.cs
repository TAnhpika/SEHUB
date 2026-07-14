using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Application.Common;
using SEHub.Application.Storage;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence;

/// <summary>
/// One-shot, idempotent migration: move &lt;img&gt; URLs from Questions.Content into QuestionAttachments, then strip images.
/// </summary>
public static partial class QuestionImageContentMigration
{
    public static async Task MigrateAsync(SEHubDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        var candidates = await context.Questions
            .AsTracking()
            .Where(q => q.Content.Contains("<img") || q.Content.Contains("!["))
            .ToListAsync(cancellationToken);

        if (candidates.Count == 0)
        {
            return;
        }

        var migratedQuestions = 0;
        var insertedImages = 0;

        foreach (var question in candidates)
        {
            var urls = ExtractImageUrls(question.Content);
            var existing = await context.QuestionAttachments
                .AsTracking()
                .Where(i => i.QuestionId == question.Id)
                .OrderBy(i => i.SortOrder)
                .ToListAsync(cancellationToken);

            var existingUrls = existing
                .Select(i => i.Url)
                .Where(u => !string.IsNullOrWhiteSpace(u))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var sortOrder = existing.Count;
            foreach (var url in urls)
            {
                if (existingUrls.Contains(url))
                {
                    continue;
                }

                CdnUrlHelper.TryGetPublicId(url, out var publicId, out _);

                context.QuestionAttachments.Add(new QuestionAttachment
                {
                    Id = Guid.NewGuid(),
                    QuestionId = question.Id,
                    Url = url,
                    PublicId = publicId ?? string.Empty,
                    SortOrder = sortOrder++,
                    CreatedAt = DateTime.UtcNow
                });
                insertedImages++;
                existingUrls.Add(url);
            }

            var sanitized = HtmlContentHelper.SanitizePostHtml(question.Content);
            if (!string.Equals(sanitized, question.Content, StringComparison.Ordinal))
            {
                question.Content = sanitized;
                question.UpdatedAt = DateTime.UtcNow;
                migratedQuestions++;
            }
            else if (urls.Count > 0 && insertedImages > 0)
            {
                migratedQuestions++;
            }
        }

        if (migratedQuestions == 0 && insertedImages == 0)
        {
            return;
        }

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "QuestionImage content migration: updated {QuestionCount} questions, inserted {ImageCount} images",
            migratedQuestions,
            insertedImages);
    }

    private static List<string> ExtractImageUrls(string content)
    {
        var urls = new List<string>();
        foreach (Match match in HtmlImgSrcRegex().Matches(content))
        {
            var url = match.Groups[1].Value.Trim();
            if (!string.IsNullOrWhiteSpace(url) &&
                !urls.Contains(url, StringComparer.OrdinalIgnoreCase))
            {
                urls.Add(url);
            }
        }

        foreach (Match match in MarkdownImgRegex().Matches(content))
        {
            var url = match.Groups[1].Value.Trim();
            if (!string.IsNullOrWhiteSpace(url) &&
                !urls.Contains(url, StringComparer.OrdinalIgnoreCase))
            {
                urls.Add(url);
            }
        }

        return urls;
    }

    [GeneratedRegex(@"<img[^>]+src=[""']([^""']+)[""']", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex HtmlImgSrcRegex();

    [GeneratedRegex(@"!\[[^\]]*\]\(([^)]+)\)", RegexOptions.CultureInvariant)]
    private static partial Regex MarkdownImgRegex();
}
