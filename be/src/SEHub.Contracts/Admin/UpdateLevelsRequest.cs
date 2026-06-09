namespace SEHub.Contracts.Admin;

public sealed class UpdateLevelsRequest
{
    public IReadOnlyList<UpdateLevelItemRequest> Levels { get; init; } = [];
}
