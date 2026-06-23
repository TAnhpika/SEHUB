namespace SEHub.Application.Abstractions.Repositories;

public interface IAiExamChatRepository
{
    Task<Domain.Entities.AiExamChatThread?> GetThreadAsync(
        Guid userId,
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task<Domain.Entities.AiExamChatThread> GetOrCreateThreadAsync(
        Guid userId,
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Domain.Entities.AiExamChatMessage>> GetMessagesAsync(
        Guid threadId,
        CancellationToken cancellationToken = default);

    Task AddMessageAsync(Domain.Entities.AiExamChatMessage message, CancellationToken cancellationToken = default);
}
