using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Events;
using SEHub.Contracts.Exams;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Exams;

public interface IAiExplanationApplicationService
{
    Task<AiExplainResponse> ExplainAsync(Guid questionId, AiExplainRequest request, CancellationToken cancellationToken = default);
}

public sealed class AiExplanationApplicationService : IAiExplanationApplicationService
{
    private readonly IExamRepository _examRepository;
    private readonly IAiExplanationService _aiService;
    private readonly IAiTokenService _aiTokenService;
    private readonly ICurrentUserService _currentUser;
    private readonly IGamificationEventPublisher _gamificationPublisher;
    private readonly AiTokenLimitSettings _settings;

    public AiExplanationApplicationService(
        IExamRepository examRepository,
        IAiExplanationService aiService,
        IAiTokenService aiTokenService,
        ICurrentUserService currentUser,
        IGamificationEventPublisher gamificationPublisher,
        IOptions<AiTokenLimitSettings> settings)
    {
        _examRepository = examRepository;
        _aiService = aiService;
        _aiTokenService = aiTokenService;
        _currentUser = currentUser;
        _gamificationPublisher = gamificationPublisher;
        _settings = settings.Value;
    }

    public async Task<AiExplainResponse> ExplainAsync(
        Guid questionId,
        AiExplainRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var billingCost = _settings.TokenCostExplain;

        await _aiTokenService.EnsureCanConsumeAsync(userId, billingCost, cancellationToken);

        var question = (await FindQuestionAsync(questionId, cancellationToken))
            ?? throw new NotFoundException("Question", questionId);

        var result = await _aiService.ExplainAsync(
            questionId,
            question.Content,
            request.Context,
            cancellationToken);

        var remaining = await _aiTokenService.RecordConsumptionAsync(userId, billingCost, cancellationToken);
        await _gamificationPublisher.PublishAsync(
            new AiUsedEvent(userId, "explain", questionId),
            cancellationToken);

        return new AiExplainResponse
        {
            Explanation = result.Explanation,
            TokensUsed = billingCost,
            RemainingTokens = remaining,
        };
    }

    private async Task<Domain.Entities.Question?> FindQuestionAsync(Guid questionId, CancellationToken cancellationToken)
    {
        var exams = await _examRepository.GetPagedAsync(new ExamQueryParams { Page = 1, PageSize = int.MaxValue }, cancellationToken);
        foreach (var exam in exams.Items)
        {
            var full = await _examRepository.GetByIdAsync(exam.Id, includeQuestions: true, cancellationToken: cancellationToken);
            var question = full?.Questions.FirstOrDefault(q => q.Id == questionId);
            if (question is not null)
            {
                return question;
            }
        }

        return null;
    }
}
