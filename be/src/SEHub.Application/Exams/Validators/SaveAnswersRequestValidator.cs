using FluentValidation;
using SEHub.Contracts.Exams;

namespace SEHub.Application.Exams.Validators;

public sealed class SaveAnswersRequestValidator : AbstractValidator<SaveAnswersRequest>
{
    public SaveAnswersRequestValidator()
    {
        RuleFor(x => x.Answers)
            .NotNull()
            .Must(a => a.All(kv =>
                kv.Key != Guid.Empty
                && kv.Value is not null
                && kv.Value.All(optionId => optionId != Guid.Empty)));
    }
}
