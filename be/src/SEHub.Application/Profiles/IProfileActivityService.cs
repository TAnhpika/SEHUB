using SEHub.Contracts.Profiles;

namespace SEHub.Application.Profiles;

public interface IProfileActivityService
{
    Task<ProfileActivityDto> GetByUsernameAsync(
        string username,
        int months = 6,
        CancellationToken cancellationToken = default);
}
