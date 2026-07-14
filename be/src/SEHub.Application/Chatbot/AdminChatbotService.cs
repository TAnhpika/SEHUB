using FluentValidation;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Common;
using SEHub.Contracts.Chatbot;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Chatbot;

public interface IAdminChatbotService
{
    Task<ChatbotSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);

    Task<ChatbotSettingsDto> UpdateSettingsAsync(
        UpdateChatbotSettingsRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatbotKnowledgeEntryDto>> GetKnowledgeAsync(CancellationToken cancellationToken = default);

    Task<ChatbotKnowledgeEntryDto> CreateKnowledgeAsync(
        UpsertChatbotKnowledgeRequest request,
        CancellationToken cancellationToken = default);

    Task<ChatbotKnowledgeEntryDto> UpdateKnowledgeAsync(
        Guid id,
        UpsertChatbotKnowledgeRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteKnowledgeAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminChatbotConversationDto>> GetRecentConversationsAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatbotMessageDto>> GetConversationMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken = default);
}

public sealed class AdminChatbotService : IAdminChatbotService
{
    private readonly IChatbotRepository _chatbotRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AdminChatbotService(
        IChatbotRepository chatbotRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork)
    {
        _chatbotRepository = chatbotRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ChatbotSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _chatbotRepository.GetSettingsAsync(cancellationToken);
        return MapSettings(settings);
    }

    public async Task<ChatbotSettingsDto> UpdateSettingsAsync(
        UpdateChatbotSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        var settings = await _chatbotRepository.GetSettingsAsync(cancellationToken);
        settings.SystemPrompt = request.SystemPrompt.Trim();
        settings.WelcomeMessage = request.WelcomeMessage.Trim();
        settings.IsEnabled = request.IsEnabled;
        settings.UpdatedAt = DateTime.UtcNow;

        await _chatbotRepository.UpdateSettingsAsync(settings, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapSettings(settings);
    }

    public async Task<IReadOnlyList<ChatbotKnowledgeEntryDto>> GetKnowledgeAsync(
        CancellationToken cancellationToken = default)
    {
        var entries = await _chatbotRepository.GetAllKnowledgeAsync(cancellationToken);
        return entries.Select(MapKnowledge).ToList();
    }

    public async Task<ChatbotKnowledgeEntryDto> CreateKnowledgeAsync(
        UpsertChatbotKnowledgeRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateKnowledgeRequest(request);

        var entry = new ChatbotKnowledgeEntry
        {
            Id = Guid.NewGuid(),
            Title = HtmlContentHelper.ToPlainText(request.Title),
            Content = HtmlContentHelper.ToPlainTextPreserveNewlines(request.Content),
            Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : HtmlContentHelper.ToPlainText(request.Tags),
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow,
        };

        await _chatbotRepository.AddKnowledgeAsync(entry, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MapKnowledge(entry);
    }

    public async Task<ChatbotKnowledgeEntryDto> UpdateKnowledgeAsync(
        Guid id,
        UpsertChatbotKnowledgeRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateKnowledgeRequest(request);

        var entry = await _chatbotRepository.GetKnowledgeByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("ChatbotKnowledgeEntry", id);

        entry.Title = HtmlContentHelper.ToPlainText(request.Title);
        entry.Content = HtmlContentHelper.ToPlainTextPreserveNewlines(request.Content);
        entry.Tags = string.IsNullOrWhiteSpace(request.Tags) ? null : HtmlContentHelper.ToPlainText(request.Tags);
        entry.IsActive = request.IsActive;
        entry.SortOrder = request.SortOrder;
        entry.UpdatedAt = DateTime.UtcNow;

        await _chatbotRepository.UpdateKnowledgeAsync(entry, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MapKnowledge(entry);
    }

    public async Task DeleteKnowledgeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entry = await _chatbotRepository.GetKnowledgeByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("ChatbotKnowledgeEntry", id);

        await _chatbotRepository.DeleteKnowledgeAsync(entry, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AdminChatbotConversationDto>> GetRecentConversationsAsync(
        CancellationToken cancellationToken = default)
    {
        var conversations = await _chatbotRepository.GetRecentConversationsAsync(50, cancellationToken);
        var userIds = conversations.Select(conversation => conversation.UserId).Distinct().ToList();
        var users = await _userRepository.GetByIdsAsync(userIds, cancellationToken);
        var usersById = users.ToDictionary(user => user.Id);

        var result = new List<AdminChatbotConversationDto>();

        foreach (var conversation in conversations)
        {
            var messages = await _chatbotRepository.GetMessagesAsync(conversation.Id, cancellationToken);
            usersById.TryGetValue(conversation.UserId, out var user);
            result.Add(new AdminChatbotConversationDto
            {
                Id = conversation.Id,
                UserId = conversation.UserId,
                Username = user?.Username ?? string.Empty,
                DisplayName = user?.DisplayName ?? string.Empty,
                Title = conversation.Title,
                CreatedAt = conversation.CreatedAt,
                MessageCount = messages.Count,
            });
        }

        return result;
    }

    public async Task<IReadOnlyList<ChatbotMessageDto>> GetConversationMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        var messages = await _chatbotRepository.GetMessagesAsync(conversationId, cancellationToken);
        return messages
            .Select(message => new ChatbotMessageDto
            {
                Id = message.Id,
                Role = message.Role,
                Text = message.Content,
                CreatedAt = message.CreatedAt,
            })
            .ToList();
    }

    private static void ValidateKnowledgeRequest(UpsertChatbotKnowledgeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Content is required.");
        }
    }

    private static ChatbotSettingsDto MapSettings(ChatbotSettings settings) => new()
    {
        SystemPrompt = settings.SystemPrompt,
        WelcomeMessage = settings.WelcomeMessage,
        IsEnabled = settings.IsEnabled,
    };

    private static ChatbotKnowledgeEntryDto MapKnowledge(ChatbotKnowledgeEntry entry) => new()
    {
        Id = entry.Id,
        Title = entry.Title,
        Content = entry.Content,
        Tags = entry.Tags,
        IsActive = entry.IsActive,
        SortOrder = entry.SortOrder,
    };
}
