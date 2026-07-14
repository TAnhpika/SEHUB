using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Application.Common;
using SEHub.Application.Storage;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence;

/// <summary>
/// One-shot, idempotent migration: move &lt;img&gt; URLs from Posts.Content into PostImages, then strip images from Content.
/// </summary>
public static partial class PostImageContentMigration
{
    public static async Task MigrateAsync(SEHubDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        var candidates = await context.Posts
            .AsTracking()
            .Where(p => !p.IsDeleted && (p.Content.Contains("<img") || p.Content.Contains("![")))
            .ToListAsync(cancellationToken);

        if (candidates.Count == 0)
        {
            return;
        }

        var migratedPosts = 0;
        var insertedImages = 0;

        foreach (var post in candidates)
        {
            var urls = ExtractImageUrls(post.Content);
            var existing = await context.PostImages
                .AsTracking()
                .Where(i => i.PostId == post.Id)
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

                context.PostImages.Add(new PostImage
                {
                    Id = Guid.NewGuid(),
                    PostId = post.Id,
                    Url = url,
                    PublicId = publicId ?? string.Empty,
                    SortOrder = sortOrder++,
                    CreatedAt = DateTime.UtcNow
                });
                insertedImages++;
                existingUrls.Add(url);
            }

            var sanitized = HtmlContentHelper.SanitizePostHtml(post.Content);
            if (!string.Equals(sanitized, post.Content, StringComparison.Ordinal))
            {
                post.Content = sanitized;
                post.UpdatedAt = DateTime.UtcNow;
                migratedPosts++;
            }
            else if (urls.Count > 0 && insertedImages > 0)
            {
                migratedPosts++;
            }
        }

        if (migratedPosts == 0 && insertedImages == 0)
        {
            return;
        }

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "PostImage content migration: updated {PostCount} posts, inserted {ImageCount} images",
            migratedPosts,
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
