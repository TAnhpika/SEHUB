using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Feed;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class PostTagRepository : IPostTagRepository
{
    private readonly SEHubDbContext _context;

    public PostTagRepository(SEHubDbContext context)
    {
        _context = context;
    }

    public async Task SyncPostTagsAsync(
        Guid postId,
        IReadOnlyList<string> tagNames,
        CancellationToken cancellationToken = default)
    {
        var normalized = tagNames
            .Select(TagSlug.NormalizeTagName)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingLinks = await _context.PostTags
            .Where(pt => pt.PostId == postId)
            .ToListAsync(cancellationToken);

        if (existingLinks.Count > 0)
        {
            _context.PostTags.RemoveRange(existingLinks);
        }

        if (normalized.Count == 0)
        {
            return;
        }

        foreach (var name in normalized)
        {
            var slug = TagSlug.ToSlug(name);
            var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Slug == slug, cancellationToken);
            if (tag is null)
            {
                tag = new Tag
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    Slug = slug,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Tags.Add(tag);
            }

            _context.PostTags.Add(new PostTag
            {
                PostId = postId,
                TagId = tag.Id
            });
        }
    }

    public async Task<IReadOnlyList<string>> GetTagNamesForPostAsync(
        Guid postId,
        CancellationToken cancellationToken = default)
    {
        var map = await GetTagNamesForPostsAsync([postId], cancellationToken);
        return map.GetValueOrDefault(postId) ?? [];
    }

    public async Task<IReadOnlyDictionary<Guid, IReadOnlyList<string>>> GetTagNamesForPostsAsync(
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default)
    {
        if (postIds.Count == 0)
        {
            return new Dictionary<Guid, IReadOnlyList<string>>();
        }

        var rows = await _context.PostTags
            .Where(pt => postIds.Contains(pt.PostId))
            .Select(pt => new { pt.PostId, pt.Tag.Name })
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(x => x.PostId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<string>)g.Select(x => x.Name).ToList());
    }
}
