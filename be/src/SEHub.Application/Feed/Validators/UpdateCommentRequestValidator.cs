using FluentValidation;
using SEHub.Contracts.Feed;

namespace SEHub.Application.Feed.Validators;

public sealed class UpdateCommentRequestValidator : AbstractValidator<UpdateCommentRequest>
{
    public UpdateCommentRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty()
            .MaximumLength(CreateCommentRequestValidator.MaxContentLength);
    }
}
