using FluentValidation;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin.Validators;

public sealed class ModeratorWarnUserRequestValidator : AbstractValidator<ModeratorWarnUserRequest>
{
    public ModeratorWarnUserRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .MaximumLength(500);
    }
}
