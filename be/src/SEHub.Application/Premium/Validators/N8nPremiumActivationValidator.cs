using FluentValidation;
using SEHub.Contracts.Premium;

namespace SEHub.Application.Premium.Validators;

public sealed class N8nPremiumActivationValidator : AbstractValidator<N8NPremiumActivationDto>
{
    public N8nPremiumActivationValidator()
    {
        RuleFor(x => x.OrderCode)
            .NotEmpty()
            .MaximumLength(64);

        RuleFor(x => x.PackageName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Amount)
            .GreaterThan(0);

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Username) || x.UserId.HasValue)
            .WithMessage("Username or UserId is required.");
    }
}
