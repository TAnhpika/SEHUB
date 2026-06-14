using FluentValidation;
using SEHub.Contracts.Admin;
using SEHub.Shared.Constants;

namespace SEHub.Application.Admin.Validators;

public sealed class AdminUserPatchRequestValidator : AbstractValidator<AdminUserPatchRequest>
{
    public AdminUserPatchRequestValidator()
    {
        RuleFor(x => x.Role)
            .Must(role => role is null
                || role.Equals(RoleNames.Student, StringComparison.OrdinalIgnoreCase)
                || role.Equals(RoleNames.Moderator, StringComparison.OrdinalIgnoreCase)
                || role.Equals(RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
            .WithMessage("Role must be Student, Moderator, or Admin.");

        RuleFor(x => x.BanReason)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.BanReason));

        RuleFor(x => x.BanType)
            .Must(type => string.IsNullOrWhiteSpace(type)
                || Enum.TryParse<SEHub.Domain.Enums.BanType>(type, true, out _))
            .WithMessage("BanType must be Temp, Permanent, or Warning.")
            .When(x => !string.IsNullOrWhiteSpace(x.BanType));
    }
}
