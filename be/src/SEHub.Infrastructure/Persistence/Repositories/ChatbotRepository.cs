using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class ChatbotRepository : IChatbotRepository
{
    private static readonly Guid DefaultSettingsId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");

    private readonly SEHubDbContext _context;

    public ChatbotRepository(SEHubDbContext context) => _context = context;

    public async Task<ChatbotSettings> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await _context.ChatbotSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings is not null)
        {
            if (ChatbotDefaults.IsLegacyPrompt(settings.SystemPrompt))
            {
                settings.SystemPrompt = ChatbotDefaults.SystemPrompt;
                settings.WelcomeMessage = ChatbotDefaults.WelcomeMessage;
                await _context.SaveChangesAsync(cancellationToken);
            }

            return settings;
        }

        settings = new ChatbotSettings
        {
            Id = DefaultSettingsId,
            SystemPrompt = ChatbotDefaults.SystemPrompt,
            WelcomeMessage = ChatbotDefaults.WelcomeMessage,
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow,
        };

        await _context.ChatbotSettings.AddAsync(settings, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return settings;
    }

    public Task UpdateSettingsAsync(ChatbotSettings settings, CancellationToken cancellationToken = default)
    {
        _context.ChatbotSettings.Update(settings);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<ChatbotKnowledgeEntry>> GetActiveKnowledgeAsync(CancellationToken cancellationToken = default) =>
        _context.ChatbotKnowledgeEntries
            .AsNoTracking()
            .Where(entry => entry.IsActive)
            .OrderBy(entry => entry.SortOrder)
            .ThenBy(entry => entry.Title)
            .ToListAsync(cancellationToken)
            .ContinueWith(task => (IReadOnlyList<ChatbotKnowledgeEntry>)task.Result, cancellationToken);

    public Task<IReadOnlyList<ChatbotKnowledgeEntry>> GetAllKnowledgeAsync(CancellationToken cancellationToken = default) =>
        _context.ChatbotKnowledgeEntries
            .AsNoTracking()
            .OrderBy(entry => entry.SortOrder)
            .ThenBy(entry => entry.Title)
            .ToListAsync(cancellationToken)
            .ContinueWith(task => (IReadOnlyList<ChatbotKnowledgeEntry>)task.Result, cancellationToken);

    public Task<ChatbotKnowledgeEntry?> GetKnowledgeByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.ChatbotKnowledgeEntries.FirstOrDefaultAsync(entry => entry.Id == id, cancellationToken);

    public async Task AddKnowledgeAsync(ChatbotKnowledgeEntry entry, CancellationToken cancellationToken = default) =>
        await _context.ChatbotKnowledgeEntries.AddAsync(entry, cancellationToken);

    public Task UpdateKnowledgeAsync(ChatbotKnowledgeEntry entry, CancellationToken cancellationToken = default)
    {
        _context.ChatbotKnowledgeEntries.Update(entry);
        return Task.CompletedTask;
    }

    public Task DeleteKnowledgeAsync(ChatbotKnowledgeEntry entry, CancellationToken cancellationToken = default)
    {
        _context.ChatbotKnowledgeEntries.Remove(entry);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<ChatbotKnowledgeEntry>> SearchKnowledgeAsync(
        string query,
        int take,
        CancellationToken cancellationToken = default)
    {
        var keywords = query
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(word => word.Length >= 2)
            .Take(8)
            .ToArray();

        if (keywords.Length == 0)
        {
            return await GetActiveKnowledgeAsync(cancellationToken)
                .ContinueWith(task => task.Result.Take(take).ToList(), cancellationToken);
        }

        var entries = await _context.ChatbotKnowledgeEntries
            .AsNoTracking()
            .Where(entry => entry.IsActive)
            .ToListAsync(cancellationToken);

        return entries
            .Select(entry => new
            {
                Entry = entry,
                Score = keywords.Count(keyword =>
                    entry.Title.Contains(keyword, StringComparison.OrdinalIgnoreCase)
                    || entry.Content.Contains(keyword, StringComparison.OrdinalIgnoreCase)
                    || (entry.Tags?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false)),
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Entry.SortOrder)
            .Take(take)
            .Select(item => item.Entry)
            .ToList();
    }

    public Task<ChatbotConversation?> GetConversationAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        _context.ChatbotConversations
            .FirstOrDefaultAsync(
                conversation => conversation.Id == conversationId && conversation.UserId == userId,
                cancellationToken);

    public Task<IReadOnlyList<ChatbotConversation>> GetUserConversationsAsync(
        Guid userId,
        int take,
        CancellationToken cancellationToken = default) =>
        _context.ChatbotConversations
            .AsNoTracking()
            .Where(conversation => conversation.UserId == userId)
            .OrderByDescending(conversation => conversation.UpdatedAt ?? conversation.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken)
            .ContinueWith(task => (IReadOnlyList<ChatbotConversation>)task.Result, cancellationToken);

    public Task<IReadOnlyList<ChatbotConversation>> GetRecentConversationsAsync(
        int take,
        CancellationToken cancellationToken = default) =>
        _context.ChatbotConversations
            .AsNoTracking()
            .OrderByDescending(conversation => conversation.UpdatedAt ?? conversation.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken)
            .ContinueWith(task => (IReadOnlyList<ChatbotConversation>)task.Result, cancellationToken);

    public async Task AddConversationAsync(ChatbotConversation conversation, CancellationToken cancellationToken = default) =>
        await _context.ChatbotConversations.AddAsync(conversation, cancellationToken);

    public Task UpdateConversationAsync(ChatbotConversation conversation, CancellationToken cancellationToken = default)
    {
        var entry = _context.Entry(conversation);
        if (entry.State != EntityState.Added)
        {
            _context.ChatbotConversations.Update(conversation);
        }

        return Task.CompletedTask;
    }

    public Task DeleteConversationAsync(ChatbotConversation conversation, CancellationToken cancellationToken = default)
    {
        _context.ChatbotConversations.Remove(conversation);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<ChatbotMessage>> GetMessagesAsync(
        Guid conversationId,
        CancellationToken cancellationToken = default) =>
        _context.ChatbotMessages
            .AsNoTracking()
            .Where(message => message.ConversationId == conversationId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync(cancellationToken)
            .ContinueWith(task => (IReadOnlyList<ChatbotMessage>)task.Result, cancellationToken);

    public async Task AddMessageAsync(ChatbotMessage message, CancellationToken cancellationToken = default) =>
        await _context.ChatbotMessages.AddAsync(message, cancellationToken);
}
