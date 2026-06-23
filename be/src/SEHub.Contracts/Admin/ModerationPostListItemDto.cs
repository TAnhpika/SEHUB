namespace SEHub.Contracts.Admin;

public sealed class ModerationPostListItemDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Excerpt { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public ModerationAuthorDto Author { get; init; } = null!;
    public IReadOnlyList<string> Tags { get; init; } = [];
    public string? Major { get; init; }
    public int? Semester { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ModeratedAt { get; init; }
    public string? ModerationNote { get; init; }
    public string? ModeratorUsername { get; init; }
}

public sealed class ModerationAuthorDto
{
    public Guid Id { get; init; }
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
}
