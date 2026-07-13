using SEHub.Domain.Entities;

namespace SEHub.Application.Profiles;

public static class ProfileCompleteness
{
    public static bool IsComplete(string? displayName, UserProfile? profile)
    {
        if (string.IsNullOrWhiteSpace(displayName) || profile is null)
        {
            return false;
        }

        return !string.IsNullOrWhiteSpace(profile.Bio)
            && !string.IsNullOrWhiteSpace(profile.Major)
            && !string.IsNullOrWhiteSpace(profile.Gender)
            && profile.DateOfBirth is not null
            && !string.IsNullOrWhiteSpace(profile.Phone)
            && !string.IsNullOrWhiteSpace(profile.Address);
    }
}
