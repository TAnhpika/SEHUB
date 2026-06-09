using FluentValidation;
using SEHub.Contracts.Auth;

namespace SEHub.Application.Auth.Validators;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(50)
            .Matches("^[a-zA-Z0-9_]+$").WithMessage("Username may only contain letters, numbers, and underscores.");
        RuleFor(x => x.Password).ApplyPasswordPolicy();
        RuleFor(x => x.DisplayName).MaximumLength(100).When(x => x.DisplayName is not null);
    }
}
