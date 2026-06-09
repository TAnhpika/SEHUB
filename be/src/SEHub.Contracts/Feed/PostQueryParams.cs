namespace SEHub.Contracts.Feed;

public sealed class PostQueryParams
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? Semester { get; init; }
    public string? Major { get; init; }
    public string? Tag { get; init; }
    public string? Search { get; init; }
    public string? SortBy { get; init; }
    public string? SortDir { get; init; }
}
