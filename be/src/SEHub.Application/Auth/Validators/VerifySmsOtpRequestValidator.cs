using FluentValidation;
using SEHub.Contracts.Auth;

namespace SEHub.Application.Auth.Validators;

public sealed class VerifySmsOtpRequestValidator : AbstractValidator<VerifySmsOtpRequest>
{
    public VerifySmsOtpRequestValidator()
    {
        RuleFor(x => x.Phone)
            .NotEmpty()
            .Must(BeValidVietnamesePhone)
            .WithMessage("Phone must be 10 digits starting with 0.");
        RuleFor(x => x.Code).NotEmpty().Length(6);
    }

    private static bool BeValidVietnamesePhone(string phone) =>
        System.Text.RegularExpressions.Regex.IsMatch(NormalizePhone(phone), @"^0\d{9}$");

    private static string NormalizePhone(string phone) =>
        new string(phone.Where(char.IsDigit).ToArray());
}
