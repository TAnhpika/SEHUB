using SEHub.Contracts.Common;
using SEHub.Contracts.Profiles;

namespace SEHub.Application.Profiles;

public interface IProfileService
{
    Task<ProfileDto> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<ProfileDto> UpdateMyProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task<ProfileAvatarUploadDto> UploadMyAvatarAsync(
        Stream fileContent,
        string fileName,
        string contentType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default);
    Task<PagedResult<ProfileRecentPostDto>> GetRecentPostsByUsernameAsync(
        string username,
        int page = 1,
        int pageSize = 5,
        CancellationToken cancellationToken = default);
}
