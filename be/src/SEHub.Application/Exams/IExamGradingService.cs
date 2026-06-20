using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;

namespace SEHub.Application.Exams;

public interface IExamGradingService
{
    ExamResultDto Grade(Exam exam, IReadOnlyDictionary<Guid, List<Guid>> answers);
}
