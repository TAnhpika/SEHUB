using FluentValidation;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin.Validators;

public sealed class ModeratePostRequestValidator : AbstractValidator<ModeratePostRequest>
{
    public ModeratePostRequestValidator()
    {
        RuleFor(x => x.Action)
            .NotEmpty()
            .Must(action =>
            {
                var normalized = action.Trim().ToLowerInvariant();
                return normalized is "approve" or "published" or "reject" or "rejected";
            })
            .WithMessage("Action must be approve or reject.");

        RuleFor(x => x.Note)
            .NotEmpty()
            .When(x => x.Action.Trim().ToLowerInvariant() is "reject" or "rejected")
            .MaximumLength(1000);
    }
}
