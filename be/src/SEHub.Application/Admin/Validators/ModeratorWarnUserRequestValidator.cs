using FluentValidation;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin.Validators;

public sealed class ModeratorWarnUserRequestValidator : AbstractValidator<ModeratorWarnUserRequest>
{
    public ModeratorWarnUserRequestValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}
