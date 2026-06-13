using FluentValidation;
using SEHub.Contracts.Feed;

namespace SEHub.Application.Feed.Validators;

public sealed class CreateCommentRequestValidator : AbstractValidator<CreateCommentRequest>
{
    public const int MaxContentLength = 2_000;

    public CreateCommentRequestValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(MaxContentLength);
    }
}
