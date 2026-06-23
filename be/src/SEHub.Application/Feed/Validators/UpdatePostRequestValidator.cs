using FluentValidation;
using SEHub.Contracts.Feed;

namespace SEHub.Application.Feed.Validators;

public sealed class UpdatePostRequestValidator : AbstractValidator<UpdatePostRequest>
{
    public UpdatePostRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(CreatePostRequestValidator.MaxContentLength);
    }
}
