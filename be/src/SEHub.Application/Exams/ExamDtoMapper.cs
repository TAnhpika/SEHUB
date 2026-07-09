using SEHub.Domain.Entities;
using SEHub.Shared.Subjects;

namespace SEHub.Application.Exams;

public static class ExamDtoMapper
{
    public static string ResolveMajor(Exam exam) =>
        exam.Subject is not null
            ? ExamMajorResolver.Normalize(exam.Subject.Code, exam.Subject.Code)
            : ExamMajorResolver.Normalize(exam.SubjectCode, exam.SubjectCode);

    public static int ResolveSemester(Exam exam) => exam.Subject?.Semester ?? 0;

    public static string ResolveSubjectName(Exam exam) => exam.Subject?.Name ?? string.Empty;
}
