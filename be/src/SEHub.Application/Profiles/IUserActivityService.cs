namespace SEHub.Application.Profiles;

public interface IUserActivityService
{
    Task RecordActivityAsync(Guid userId, CancellationToken cancellationToken = default);
}
