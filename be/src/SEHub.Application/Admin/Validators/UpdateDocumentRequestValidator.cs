using FluentValidation;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin.Validators;

public sealed class UpdateDocumentRequestValidator : AbstractValidator<UpdateDocumentRequest>
{
    public UpdateDocumentRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Title));

        RuleFor(x => x.AccessTier)
            .Must(tier =>
            {
                if (string.IsNullOrWhiteSpace(tier))
                {
                    return true;
                }

                var normalized = tier.Trim();
                return normalized.Equals("FreePreview", StringComparison.OrdinalIgnoreCase)
                    || normalized.Equals("PremiumFull", StringComparison.OrdinalIgnoreCase);
            })
            .WithMessage("AccessTier must be FreePreview or PremiumFull.")
            .When(x => !string.IsNullOrWhiteSpace(x.AccessTier));

        RuleFor(x => x.PageCount)
            .GreaterThan(0)
            .When(x => x.PageCount.HasValue);
    }
}
