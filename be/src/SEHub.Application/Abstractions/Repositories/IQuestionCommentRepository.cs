using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IQuestionCommentRepository
{
    Task<QuestionComment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QuestionComment>> GetByQuestionIdAsync(
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default);
    Task AddAsync(QuestionComment comment, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(QuestionComment comment, Guid deletedById, CancellationToken cancellationToken = default);
}
