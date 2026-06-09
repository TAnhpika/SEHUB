namespace SEHub.Contracts.Profiles;

public sealed class UpdateProfileRequest
{
    public string? DisplayName { get; init; }
    public string? Bio { get; init; }
    public string? Major { get; init; }
    public string? Semester { get; init; }
    public string? AvatarUrl { get; init; }
}
