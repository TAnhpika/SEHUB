using FluentValidation;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin.Validators;

public sealed class ModeratorBanUserRequestValidator : AbstractValidator<ModeratorBanUserRequest>
{
    public ModeratorBanUserRequestValidator()
    {
        RuleFor(x => x.DurationDays)
            .Must(days => days is 1 or 7 or 30)
            .WithMessage("DurationDays must be 1, 7, or 30.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .MaximumLength(500);
    }
}
