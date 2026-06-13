using FluentValidation;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin.Validators;

public sealed class CreateBadgeRequestValidator : AbstractValidator<CreateBadgeRequest>
{
    public CreateBadgeRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.ConditionJson)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrWhiteSpace(x.ConditionJson));
    }
}
