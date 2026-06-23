using FluentValidation;
using SEHub.Contracts.Premium;

namespace SEHub.Application.Premium.Validators;

public sealed class PremiumRefundBankDetailsValidator : AbstractValidator<PremiumRefundBankDetailsRequest>
{
    public PremiumRefundBankDetailsValidator()
    {
        RuleFor(x => x.OrderCode).NotEmpty().MaximumLength(64);
        RuleFor(x => x.Username).NotEmpty().MaximumLength(64);
        RuleFor(x => x.BankName).NotEmpty().MaximumLength(128);
        RuleFor(x => x.AccountNumber).NotEmpty().MaximumLength(32);
        RuleFor(x => x.AccountName).NotEmpty().MaximumLength(128);
        RuleFor(x => x.Note).MaximumLength(500).When(x => !string.IsNullOrWhiteSpace(x.Note));
    }
}
