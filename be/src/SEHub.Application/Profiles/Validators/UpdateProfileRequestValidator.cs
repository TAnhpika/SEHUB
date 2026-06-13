using FluentValidation;
using SEHub.Contracts.Profiles;

namespace SEHub.Application.Profiles.Validators;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    private static readonly HashSet<string> AllowedGenders = new(StringComparer.OrdinalIgnoreCase)
    {
        "male", "female", "other"
    };

    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.DisplayName).MaximumLength(100).When(x => x.DisplayName is not null);
        RuleFor(x => x.Bio).MaximumLength(500).When(x => x.Bio is not null);
        RuleFor(x => x.Major).MaximumLength(100).When(x => x.Major is not null);
        RuleFor(x => x.AvatarUrl).MaximumLength(500).When(x => x.AvatarUrl is not null);
        RuleFor(x => x.Gender)
            .Must(g => g is null || AllowedGenders.Contains(g))
            .WithMessage("Gender must be male, female, or other.");
        RuleFor(x => x.Phone)
            .Matches(@"^\d{10,15}$")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone))
            .WithMessage("Phone must contain 10-15 digits.");
        RuleFor(x => x.Address).MaximumLength(200).When(x => x.Address is not null);
        RuleFor(x => x.DateOfBirth)
            .Must(BeValidPastOrPresentDate)
            .When(x => !string.IsNullOrWhiteSpace(x.DateOfBirth))
            .WithMessage("DateOfBirth must be a valid date and cannot be in the future.");
    }

    private static bool BeValidPastOrPresentDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        if (!DateOnly.TryParse(value, out var date))
        {
            return false;
        }

        return date <= DateOnly.FromDateTime(DateTime.UtcNow);
    }
}
