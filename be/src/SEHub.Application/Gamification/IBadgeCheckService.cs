namespace SEHub.Application.Gamification;

public interface IBadgeCheckService
{
    Task EvaluateForTriggerAsync(Guid userId, string triggerType, CancellationToken cancellationToken = default);
}
