using FluentValidation;
using SEHub.Contracts.Feed;

namespace SEHub.Application.Feed.Validators;

public sealed class CreatePostRequestValidator : AbstractValidator<CreatePostRequest>
{
    public const int MaxContentLength = 10_000;

    public CreatePostRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(MaxContentLength);
    }
}
