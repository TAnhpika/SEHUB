using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IQuestionAttachmentRepository
{
    Task<QuestionAttachment> AddAsync(
        Guid questionId,
        string publicId,
        string url,
        int sortOrder,
        CancellationToken cancellationToken = default);
}
