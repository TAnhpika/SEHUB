using SEHub.Contracts.Exams;

namespace SEHub.Application.Exams;

public interface IQuestionCommentService
{
    Task<IReadOnlyList<QuestionCommentDto>> GetCommentsAsync(
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default);

    Task<QuestionCommentDto> CreateAsync(
        Guid examId,
        Guid questionId,
        CreateQuestionCommentRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid examId,
        Guid questionId,
        Guid commentId,
        CancellationToken cancellationToken = default);
}
