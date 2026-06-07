using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;

namespace SEHub.Application.Exams;

public interface IExamQueryService
{
    Task<PagedResult<ExamListItemDto>> GetExamsAsync(ExamQueryParams query, CancellationToken cancellationToken = default);
    Task<ExamDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QuestionPublicDto>> GetQuestionsAsync(Guid examId, CancellationToken cancellationToken = default);
    Task<QuestionAnswerDto> GetQuestionWithAnswerAsync(Guid examId, Guid questionId, CancellationToken cancellationToken = default);
}
