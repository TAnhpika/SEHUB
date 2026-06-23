using FluentValidation;
using SEHub.Contracts.Premium;

namespace SEHub.Application.Premium.Validators;

public sealed class PremiumRefundRequestValidator : AbstractValidator<PremiumRefundRequestDto>
{
    public PremiumRefundRequestValidator()
    {
        RuleFor(x => x.OrderCode)
            .NotEmpty()
            .MaximumLength(64);

        RuleFor(x => x.Reason)
            .NotEmpty()
            .MaximumLength(500);
    }
}
