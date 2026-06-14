using FluentValidation;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin.Validators;

public sealed class UpdateLevelsRequestValidator : AbstractValidator<UpdateLevelsRequest>
{
    public UpdateLevelsRequestValidator()
    {
        RuleFor(x => x.Levels)
            .NotEmpty()
            .WithMessage("At least one level is required.");

        RuleForEach(x => x.Levels).ChildRules(level =>
        {
            level.RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(100);

            level.RuleFor(x => x.MinPoints)
                .GreaterThanOrEqualTo(0);

            level.RuleFor(x => x.VoucherPercent)
                .InclusiveBetween(0, 100)
                .When(x => x.VoucherPercent.HasValue);
        });

        RuleFor(x => x.Levels)
            .Must(levels =>
            {
                var points = levels.Select(l => l.MinPoints).ToList();
                for (var i = 1; i < points.Count; i++)
                {
                    if (points[i] < points[i - 1])
                    {
                        return false;
                    }
                }

                return true;
            })
            .WithMessage("MinPoints must be in ascending order.");
    }
}
