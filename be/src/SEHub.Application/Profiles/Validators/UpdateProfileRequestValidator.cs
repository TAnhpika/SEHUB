using FluentValidation;
using SEHub.Contracts.Profiles;

namespace SEHub.Application.Profiles.Validators;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.DisplayName).MaximumLength(100).When(x => x.DisplayName is not null);
        RuleFor(x => x.Bio).MaximumLength(500).When(x => x.Bio is not null);
        RuleFor(x => x.Major).MaximumLength(100).When(x => x.Major is not null);
        RuleFor(x => x.AvatarUrl).MaximumLength(500).When(x => x.AvatarUrl is not null);
    }
}
