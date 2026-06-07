using Microsoft.Extensions.Options;

using SEHub.Application.Abstractions;

using SEHub.Application.Abstractions.Repositories;

using SEHub.Contracts.Exams;

using SEHub.Domain.Entities;

using SEHub.Domain.Exceptions;

using SEHub.Shared.Constants;



namespace SEHub.Application.Exams;



public interface IAiExplanationApplicationService

{

    Task<AiExplainResponse> ExplainAsync(Guid questionId, AiExplainRequest request, CancellationToken cancellationToken = default);

}



public sealed class AiExplanationApplicationService : IAiExplanationApplicationService

{

    private readonly IExamRepository _examRepository;

    private readonly IAiExplanationService _aiService;

    private readonly IAiTokenUsageRepository _tokenUsageRepository;

    private readonly ICurrentUserService _currentUser;

    private readonly IUnitOfWork _unitOfWork;

    private readonly int _freeLimit;

    private readonly int _premiumLimit;



    public AiExplanationApplicationService(

        IExamRepository examRepository,

        IAiExplanationService aiService,

        IAiTokenUsageRepository tokenUsageRepository,

        ICurrentUserService currentUser,

        IUnitOfWork unitOfWork,

        IOptions<AiTokenLimitSettings> tokenLimitSettings)

    {

        _examRepository = examRepository;

        _aiService = aiService;

        _tokenUsageRepository = tokenUsageRepository;

        _currentUser = currentUser;

        _unitOfWork = unitOfWork;

        _freeLimit = tokenLimitSettings.Value.DailyTokenLimitFree;

        _premiumLimit = tokenLimitSettings.Value.DailyTokenLimitPremium;

    }



    public async Task<AiExplainResponse> ExplainAsync(Guid questionId, AiExplainRequest request, CancellationToken cancellationToken = default)

    {

        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        var dailyLimit = GetDailyLimit();



        var consumed = await _tokenUsageRepository.GetTodayConsumedAsync(userId, cancellationToken);

        if (consumed >= dailyLimit)

        {

            throw new ForbiddenException(ErrorCodes.TokenLimitExceeded);

        }



        var question = (await FindQuestionAsync(questionId, cancellationToken))

            ?? throw new NotFoundException("Question", questionId);



        var result = await _aiService.ExplainAsync(questionId, question.Content, request.Context, cancellationToken);

        await RecordTokenUsageAsync(userId, result.TokensUsed, cancellationToken);



        return new AiExplainResponse

        {

            Explanation = result.Explanation,

            TokensUsed = result.TokensUsed,

            RemainingTokens = Math.Max(0, dailyLimit - consumed - result.TokensUsed)

        };

    }



    private int GetDailyLimit() =>

        _currentUser.IsPremium || _currentUser.IsModeratorOrAdmin ? _premiumLimit : _freeLimit;



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



    private async Task RecordTokenUsageAsync(Guid userId, int tokensUsed, CancellationToken cancellationToken)

    {

        var usage = await _tokenUsageRepository.GetTodayUsageAsync(userId, cancellationToken);

        if (usage is null)

        {

            usage = new AiTokenDailyUsage

            {

                Id = Guid.NewGuid(),

                UserId = userId,

                UsageDate = DateOnly.FromDateTime(DateTime.UtcNow),

                TokensConsumed = tokensUsed,

                CreatedAt = DateTime.UtcNow

            };

            await _tokenUsageRepository.AddAsync(usage, cancellationToken);

        }

        else

        {

            usage.TokensConsumed += tokensUsed;

            usage.UpdatedAt = DateTime.UtcNow;

            await _tokenUsageRepository.UpdateAsync(usage, cancellationToken);

        }



        await _unitOfWork.SaveChangesAsync(cancellationToken);

    }

}

