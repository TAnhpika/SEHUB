using FluentValidation;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

public interface IAiExamChatApplicationService
{
    Task<ExamAiChatResponse> GetThreadAsync(Guid examId, Guid questionId, CancellationToken cancellationToken = default);

    Task<ExamAiChatResponse> SendMessageAsync(
        Guid examId,
        Guid questionId,
        ExamAiChatRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class AiExamChatApplicationService : IAiExamChatApplicationService
{
    private readonly IExamRepository _examRepository;
    private readonly IAiExamChatRepository _chatRepository;
    private readonly IAiProvider _aiProvider;
    private readonly IAiTokenService _aiTokenService;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly AiTokenLimitSettings _settings;

    public AiExamChatApplicationService(
        IExamRepository examRepository,
        IAiExamChatRepository chatRepository,
        IAiProvider aiProvider,
        IAiTokenService aiTokenService,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IOptions<AiTokenLimitSettings> settings)
    {
        _examRepository = examRepository;
        _chatRepository = chatRepository;
        _aiProvider = aiProvider;
        _aiTokenService = aiTokenService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _settings = settings.Value;
    }

    public async Task<ExamAiChatResponse> GetThreadAsync(
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default)
    {
        EnsurePremiumChatAccess();

        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var thread = await _chatRepository.GetThreadAsync(userId, examId, questionId, cancellationToken);
        if (thread is null)
        {
            return new ExamAiChatResponse
            {
                Messages = Array.Empty<ExamAiChatMessageDto>(),
                RemainingTokens = (await _aiTokenService.GetStatusAsync(userId, cancellationToken)).Remaining,
            };
        }

        var messages = await _chatRepository.GetMessagesAsync(thread.Id, cancellationToken);
        var status = await _aiTokenService.GetStatusAsync(userId, cancellationToken);

        return new ExamAiChatResponse
        {
            ThreadId = thread.Id,
            Messages = MapMessages(messages),
            RemainingTokens = status.Remaining,
        };
    }

    public async Task<ExamAiChatResponse> SendMessageAsync(
        Guid examId,
        Guid questionId,
        ExamAiChatRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsurePremiumChatAccess();

        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var messageText = request.Message?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(messageText))
        {
            throw new ValidationException("Message is required.");
        }

        if (messageText.Length > 2000)
        {
            throw new ValidationException("Message must be at most 2000 characters.");
        }

        var billingCost = _settings.TokenCostChat;
        await _aiTokenService.EnsureCanConsumeAsync(userId, billingCost, cancellationToken);

        var question = await LoadQuestionAsync(examId, questionId, cancellationToken)
            ?? throw new NotFoundException("Question", questionId);

        var thread = await _chatRepository.GetOrCreateThreadAsync(userId, examId, questionId, cancellationToken);
        var history = await _chatRepository.GetMessagesAsync(thread.Id, cancellationToken);

        var providerMessages = history
            .Select(item => new AiProviderMessage
            {
                Role = item.Role,
                Text = item.Content,
            })
            .Append(new AiProviderMessage { Role = "user", Text = messageText })
            .ToList();

        var systemInstruction = BuildSystemInstruction(question);
        var result = await _aiProvider.CompleteAsync(
            new AiProviderRequest
            {
                SystemInstruction = systemInstruction,
                Messages = providerMessages,
            },
            cancellationToken);

        var now = DateTime.UtcNow;
        var userMessage = new AiExamChatMessage
        {
            Id = Guid.NewGuid(),
            ThreadId = thread.Id,
            Role = "user",
            Content = messageText,
            CreatedAt = now,
        };
        var assistantMessage = new AiExamChatMessage
        {
            Id = Guid.NewGuid(),
            ThreadId = thread.Id,
            Role = "assistant",
            Content = result.Text,
            CreatedAt = now.AddMilliseconds(1),
        };

        if (thread.CreatedAt == default)
        {
            thread.CreatedAt = now;
        }

        thread.UpdatedAt = now;
        await _chatRepository.AddMessageAsync(userMessage, cancellationToken);
        await _chatRepository.AddMessageAsync(assistantMessage, cancellationToken);
        var remaining = await _aiTokenService.RecordConsumptionAsync(userId, billingCost, cancellationToken);

        return new ExamAiChatResponse
        {
            ThreadId = thread.Id,
            Reply = result.Text,
            TokensUsed = billingCost,
            RemainingTokens = remaining,
            Messages = MapMessages(history.Concat([userMessage, assistantMessage]).ToList()),
        };
    }

    private void EnsurePremiumChatAccess()
    {
        if (!_currentUser.IsPremium && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException(ErrorCodes.PremiumRequired);
        }
    }

    private async Task<Question?> LoadQuestionAsync(
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken)
    {
        var exam = await _examRepository.GetByIdAsync(examId, includeQuestions: true, cancellationToken: cancellationToken);
        return exam?.Questions.FirstOrDefault(question => question.Id == questionId);
    }

    private static string BuildSystemInstruction(Question question)
    {
        var optionsText = string.Join(
            "\n",
            question.Options
                .OrderBy(option => option.Label)
                .Select(option =>
                {
                    var marker = question.CorrectOptionId == option.Id ? " (đáp án đúng)" : string.Empty;
                    return $"- {option.Label}: {option.Text}{marker}";
                }));

        return
            "Bạn là trợ giảng SEHub. Trả lời ngắn gọn, rõ ràng bằng tiếng Việt về câu hỏi trắc nghiệm bên dưới. " +
            "Không bịa thông tin ngoài ngữ cảnh câu hỏi.\n\n" +
            $"Câu hỏi:\n{question.Content}\n\nLựa chọn:\n{optionsText}";
    }

    private static IReadOnlyList<ExamAiChatMessageDto> MapMessages(IReadOnlyList<AiExamChatMessage> messages) =>
        messages
            .Select(message => new ExamAiChatMessageDto
            {
                Id = message.Id,
                Role = message.Role,
                Text = message.Content,
                CreatedAt = message.CreatedAt,
            })
            .ToList();
}
