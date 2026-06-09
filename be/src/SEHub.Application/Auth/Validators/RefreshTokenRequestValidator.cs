using FluentValidation;
using SEHub.Contracts.Auth;

namespace SEHub.Application.Auth.Validators;

public sealed class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public const int MaxTokenLength = 256;

    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty().MaximumLength(MaxTokenLength);
    }
}
