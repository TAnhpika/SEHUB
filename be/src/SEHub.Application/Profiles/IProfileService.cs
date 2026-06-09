using SEHub.Contracts.Profiles;

namespace SEHub.Application.Profiles;

public interface IProfileService
{
    Task<ProfileDto> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<ProfileDto> UpdateMyProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default);
}
