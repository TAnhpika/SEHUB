using FluentValidation;
using SEHub.Contracts.Auth;

namespace SEHub.Application.Auth.Validators;

public sealed class SendEmailVerificationRequestValidator : AbstractValidator<SendEmailVerificationRequest>
{
    public SendEmailVerificationRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}
