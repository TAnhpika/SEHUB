namespace SEHub.Contracts.Admin;

public sealed class ViolationsQueryParams
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? Search { get; init; }
    public string? Status { get; init; }
}
