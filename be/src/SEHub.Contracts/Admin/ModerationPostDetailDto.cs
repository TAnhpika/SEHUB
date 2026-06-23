namespace SEHub.Contracts.Admin;

using SEHub.Contracts.Feed;

public sealed class ModerationPostDetailDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public string Excerpt { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public ModerationAuthorDto Author { get; init; } = null!;
    public IReadOnlyList<string> Tags { get; init; } = [];
    public string? Major { get; init; }
    public int? Semester { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public DateTime? ModeratedAt { get; init; }
    public string? ModerationNote { get; init; }
    public string? ModeratorUsername { get; init; }
    public IReadOnlyList<PostImageDto> Images { get; init; } = [];
}
