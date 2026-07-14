using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IQuestionAttachmentRepository
{
    Task<QuestionAttachment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QuestionAttachment>> GetByQuestionIdAsync(
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QuestionAttachment>> GetByQuestionIdsAsync(
        IReadOnlyList<Guid> questionIds,
        CancellationToken cancellationToken = default);

    Task<bool> QuestionExistsAsync(Guid questionId, CancellationToken cancellationToken = default);

    Task<QuestionAttachment> AddAsync(
        Guid questionId,
        string publicId,
        string url,
        int sortOrder,
        CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<QuestionAttachment> attachments, CancellationToken cancellationToken = default);

    Task DeleteRangeAsync(IEnumerable<QuestionAttachment> attachments, CancellationToken cancellationToken = default);
}
