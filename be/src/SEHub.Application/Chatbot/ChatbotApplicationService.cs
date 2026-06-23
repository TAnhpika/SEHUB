using FluentValidation;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Contracts.Chatbot;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Chatbot;

public interface IChatbotApplicationService
{
    Task<ChatbotSettingsDto> GetPublicSettingsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatbotConversationDto>> GetMyConversationsAsync(CancellationToken cancellationToken = default);

    Task<ChatbotReplyResponse> GetConversationMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken = default);

    Task<ChatbotReplyResponse> SendMessageAsync(
        ChatbotMessageRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class ChatbotApplicationService : IChatbotApplicationService
{
    private readonly IChatbotRepository _chatbotRepository;
    private readonly IAiProvider _aiProvider;
    private readonly IAiTokenService _aiTokenService;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly AiTokenLimitSettings _settings;

    public ChatbotApplicationService(
        IChatbotRepository chatbotRepository,
        IAiProvider aiProvider,
        IAiTokenService aiTokenService,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IOptions<AiTokenLimitSettings> settings)
    {
        _chatbotRepository = chatbotRepository;
        _aiProvider = aiProvider;
        _aiTokenService = aiTokenService;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _settings = settings.Value;
    }

    public async Task<ChatbotSettingsDto> GetPublicSettingsAsync(CancellationToken cancellationToken = default)
    {
        EnsurePremiumAccess();
        var settings = await _chatbotRepository.GetSettingsAsync(cancellationToken);
        return MapSettings(settings);
    }

    public async Task<IReadOnlyList<ChatbotConversationDto>> GetMyConversationsAsync(
        CancellationToken cancellationToken = default)
    {
        EnsurePremiumAccess();
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var conversations = await _chatbotRepository.GetUserConversationsAsync(userId, 20, cancellationToken);
        return conversations
            .Select(conversation => new ChatbotConversationDto
            {
                Id = conversation.Id,
                Title = conversation.Title,
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt,
            })
            .ToList();
    }

    public async Task<ChatbotReplyResponse> GetConversationMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        EnsurePremiumAccess();
        var userId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        var conversation = await _chatbotRepository.GetConversationAsync(conversationId, userId, cancellationToken)
            ?? throw new NotFoundException("ChatbotConversation", conversationId);

        var messages = await _chatbotRepository.GetMessagesAsync(conversation.Id, cancellationToken);
        var status = await _aiTokenService.GetStatusAsync(userId, cancellationToken);

        return new ChatbotReplyResponse
        {
            ConversationId = conversation.Id,
            RemainingTokens = status.Remaining,
            Messages = MapMessages(messages),
        };
    }

    public async Task<ChatbotReplyResponse> SendMessageAsync(
        ChatbotMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsurePremiumAccess();

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

        var settings = await _chatbotRepository.GetSettingsAsync(cancellationToken);
        if (!settings.IsEnabled)
        {
            throw new ForbiddenException("Chatbot is currently disabled.");
        }

        var billingCost = _settings.TokenCostChat;
        await _aiTokenService.EnsureCanConsumeAsync(userId, billingCost, cancellationToken);

        ChatbotConversation? conversation = null;
        IReadOnlyList<ChatbotMessage> history = [];

        if (request.ConversationId is Guid conversationId)
        {
            conversation = await _chatbotRepository.GetConversationAsync(conversationId, userId, cancellationToken)
                ?? throw new NotFoundException("ChatbotConversation", conversationId);
            history = await _chatbotRepository.GetMessagesAsync(conversation.Id, cancellationToken);
        }

        var knowledge = await _chatbotRepository.SearchKnowledgeAsync(messageText, 5, cancellationToken);
        var knowledgeContext = BuildKnowledgeContext(knowledge);

        var providerMessages = history
            .Select(item => new AiProviderMessage { Role = item.Role, Text = item.Content })
            .Append(new AiProviderMessage { Role = "user", Text = messageText })
            .ToList();

        var systemInstruction =
            $"{settings.SystemPrompt.Trim()}\n\n" +
            (string.IsNullOrWhiteSpace(knowledgeContext)
                ? "Không có mục knowledge base phù hợp với câu hỏi. Trả lời trong phạm vi system prompt; " +
                  "nếu thiếu dữ liệu chính thức, hãy nói rõ và gợi ý sinh viên liên hệ phòng đào tạo hoặc gửi phản hồi qua SEHub."
                : $"Knowledge base (ưu tiên cao nhất):\n{knowledgeContext}");

        var result = await _aiProvider.CompleteAsync(
            new AiProviderRequest
            {
                SystemInstruction = systemInstruction,
                Messages = providerMessages,
            },
            cancellationToken);

        if (conversation is null)
        {
            conversation = new ChatbotConversation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = messageText.Length > 80 ? $"{messageText[..80]}..." : messageText,
                CreatedAt = DateTime.UtcNow,
            };
            await _chatbotRepository.AddConversationAsync(conversation, cancellationToken);
        }

        var now = DateTime.UtcNow;
        var userMessage = new ChatbotMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = "user",
            Content = messageText,
            CreatedAt = now,
        };
        var assistantMessage = new ChatbotMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = "assistant",
            Content = result.Text,
            CreatedAt = now.AddMilliseconds(1),
        };

        conversation.UpdatedAt = now;
        await _chatbotRepository.UpdateConversationAsync(conversation, cancellationToken);
        await _chatbotRepository.AddMessageAsync(userMessage, cancellationToken);
        await _chatbotRepository.AddMessageAsync(assistantMessage, cancellationToken);

        var remaining = await _aiTokenService.RecordConsumptionAsync(userId, billingCost, cancellationToken);

        return new ChatbotReplyResponse
        {
            ConversationId = conversation.Id,
            Reply = result.Text,
            TokensUsed = billingCost,
            RemainingTokens = remaining,
            Messages = MapMessages(history.Concat([userMessage, assistantMessage]).ToList()),
        };
    }

    private void EnsurePremiumAccess()
    {
        if (!_currentUser.IsPremium && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException(ErrorCodes.PremiumRequired);
        }
    }

    private static string BuildKnowledgeContext(IReadOnlyList<ChatbotKnowledgeEntry> entries) =>
        string.Join(
            "\n\n",
            entries.Select(entry => $"[{entry.Title}]\n{entry.Content}"));

    private static ChatbotSettingsDto MapSettings(ChatbotSettings settings) => new()
    {
        SystemPrompt = settings.SystemPrompt,
        WelcomeMessage = settings.WelcomeMessage,
        IsEnabled = settings.IsEnabled,
    };

    private static IReadOnlyList<ChatbotMessageDto> MapMessages(IReadOnlyList<ChatbotMessage> messages) =>
        messages
            .Select(message => new ChatbotMessageDto
            {
                Id = message.Id,
                Role = message.Role,
                Text = message.Content,
                CreatedAt = message.CreatedAt,
            })
            .ToList();
}
