using FluentValidation;
using SEHub.Contracts.Feed;

namespace SEHub.Application.Feed.Validators;

public sealed class ReportPostRequestValidator : AbstractValidator<ReportPostRequest>
{
    public const int MaxReasonLength = 500;

    public ReportPostRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(MaxReasonLength);
    }
}
