using SEHub.Contracts.Profiles;

namespace SEHub.Application.Profiles;

public interface IProfileStatsService
{
    Task<ProfileStatsDto> GetMyStatsAsync(CancellationToken cancellationToken = default);
}
