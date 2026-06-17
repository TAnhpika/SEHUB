using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IExamAttachmentRepository
{
    Task<ExamAttachment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ExamAttachment>> GetByExamIdAsync(Guid examId, CancellationToken cancellationToken = default);
    Task AddAsync(ExamAttachment attachment, CancellationToken cancellationToken = default);
    Task DeleteAsync(ExamAttachment attachment, CancellationToken cancellationToken = default);
}
