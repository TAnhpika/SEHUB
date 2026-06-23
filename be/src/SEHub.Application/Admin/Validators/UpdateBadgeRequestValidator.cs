using FluentValidation;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin.Validators;

public sealed class UpdateBadgeRequestValidator : AbstractValidator<UpdateBadgeRequest>
{
    public UpdateBadgeRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100)
            .When(x => x.Name is not null);

        RuleFor(x => x.ConditionJson)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.ConditionJson));
    }
}
