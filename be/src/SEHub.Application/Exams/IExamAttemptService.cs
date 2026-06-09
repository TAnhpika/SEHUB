using SEHub.Contracts.Exams;

namespace SEHub.Application.Exams;

public interface IExamAttemptService
{
    Task<ExamAttemptDto> StartAttemptAsync(Guid examId, CancellationToken cancellationToken = default);
    Task<ExamAttemptDto?> GetCurrentAttemptAsync(Guid examId, CancellationToken cancellationToken = default);
    Task<ExamAttemptDto> GetAttemptAsync(Guid examId, Guid attemptId, CancellationToken cancellationToken = default);
    Task<ExamAttemptDto> SaveAnswersAsync(Guid examId, Guid attemptId, SaveAnswersRequest request, CancellationToken cancellationToken = default);
    Task<ExamResultDto> SubmitAsync(Guid examId, Guid attemptId, CancellationToken cancellationToken = default);
    Task<ExamResultDto> GetResultAsync(Guid examId, Guid attemptId, CancellationToken cancellationToken = default);
}
