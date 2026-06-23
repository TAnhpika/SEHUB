using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class AiExamChatRepository : IAiExamChatRepository
{
    private readonly SEHubDbContext _context;

    public AiExamChatRepository(SEHubDbContext context) => _context = context;

    public Task<AiExamChatThread?> GetThreadAsync(
        Guid userId,
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default) =>
        _context.AiExamChatThreads
            .AsNoTracking()
            .FirstOrDefaultAsync(
                thread => thread.UserId == userId
                    && thread.ExamId == examId
                    && thread.QuestionId == questionId,
                cancellationToken);

    public async Task<AiExamChatThread> GetOrCreateThreadAsync(
        Guid userId,
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.AiExamChatThreads
            .FirstOrDefaultAsync(
                thread => thread.UserId == userId
                    && thread.ExamId == examId
                    && thread.QuestionId == questionId,
                cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var thread = new AiExamChatThread
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ExamId = examId,
            QuestionId = questionId,
            CreatedAt = DateTime.UtcNow,
        };

        await _context.AiExamChatThreads.AddAsync(thread, cancellationToken);
        return thread;
    }

    public async Task<IReadOnlyList<AiExamChatMessage>> GetMessagesAsync(
        Guid threadId,
        CancellationToken cancellationToken = default) =>
        await _context.AiExamChatMessages
            .AsNoTracking()
            .Where(message => message.ThreadId == threadId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task AddMessageAsync(AiExamChatMessage message, CancellationToken cancellationToken = default) =>
        await _context.AiExamChatMessages.AddAsync(message, cancellationToken);
}
