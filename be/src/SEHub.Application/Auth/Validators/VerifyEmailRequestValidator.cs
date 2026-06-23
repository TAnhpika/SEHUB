using FluentValidation;
using SEHub.Contracts.Auth;

namespace SEHub.Application.Auth.Validators;

public sealed class VerifyEmailRequestValidator : AbstractValidator<VerifyEmailRequest>
{
    public VerifyEmailRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Code).NotEmpty().Length(6);
    }
}
