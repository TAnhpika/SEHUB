using FluentAssertions;
using SEHub.Application.Profiles;
using SEHub.Domain.Entities;

namespace SEHub.Application.UnitTests.Profiles;

public sealed class ProfileCompletenessTests
{
    private static UserProfile CompleteProfile() => new()
    {
        Bio = "Hello",
        Major = "SE",
        Gender = "male",
        DateOfBirth = new DateOnly(2000, 1, 1),
        Phone = "0123456789",
        Address = "HCMC",
    };

    [Fact]
    public void IsComplete_WhenAllFieldsPresent_ReturnsTrue_EvenWithoutAvatar()
    {
        var profile = CompleteProfile();
        profile.AvatarUrl = null;

        ProfileCompleteness.IsComplete("Demo User", profile).Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void IsComplete_WhenDisplayNameMissing_ReturnsFalse(string? displayName)
    {
        ProfileCompleteness.IsComplete(displayName, CompleteProfile()).Should().BeFalse();
    }

    [Fact]
    public void IsComplete_WhenProfileNull_ReturnsFalse()
    {
        ProfileCompleteness.IsComplete("Demo User", null).Should().BeFalse();
    }

    [Fact]
    public void IsComplete_WhenGenderNull_ReturnsFalse()
    {
        var profile = CompleteProfile();
        profile.Gender = null;

        ProfileCompleteness.IsComplete("Demo User", profile).Should().BeFalse();
    }

    [Fact]
    public void IsComplete_WhenBioMissing_ReturnsFalse()
    {
        var profile = CompleteProfile();
        profile.Bio = "  ";

        ProfileCompleteness.IsComplete("Demo User", profile).Should().BeFalse();
    }

    [Fact]
    public void IsComplete_WhenDateOfBirthMissing_ReturnsFalse()
    {
        var profile = CompleteProfile();
        profile.DateOfBirth = null;

        ProfileCompleteness.IsComplete("Demo User", profile).Should().BeFalse();
    }
}
