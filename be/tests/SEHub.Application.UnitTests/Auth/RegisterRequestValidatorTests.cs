using SEHub.Application.Auth.Validators;
using SEHub.Contracts.Auth;

namespace SEHub.Application.UnitTests.Auth;

public sealed class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator _validator = new();

    [Fact]
    public void Validate_WeakPasswordWithoutUppercaseOrSpecial_Fails()
    {
        var request = new RegisterRequest
        {
            Email = "test@fpt.edu.vn",
            Username = "testuser01",
            Password = "hauvip123",
            DisplayName = "Test User"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void Validate_StrongPassword_Succeeds()
    {
        var request = new RegisterRequest
        {
            Email = "test@fpt.edu.vn",
            Username = "testuser01",
            Password = "Student@123",
            DisplayName = "Test User"
        };

        var result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
