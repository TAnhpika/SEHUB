using FluentValidation;
using SEHub.Contracts.Exams;

namespace SEHub.Application.Exams.Validators;

public sealed class SubmitPracticeRequestValidator : AbstractValidator<SubmitPracticeRequest>
{
    public SubmitPracticeRequestValidator()
    {
        RuleFor(x => x.GitHubRepoUrl)
            .NotEmpty()
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
                && uri.Host.Contains("github.com", StringComparison.OrdinalIgnoreCase))
            .WithMessage("GitHubRepoUrl must be a valid GitHub repository URL.");
    }
}
