using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Exams;

public static class ExamSubjectBinder
{
    public static async Task<Subject> ResolveSubjectAsync(
        string subjectCode,
        ISubjectRepository subjectRepository,
        CancellationToken cancellationToken = default)
    {
        var normalized = subjectCode.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new NotFoundException("Subject code is required.");
        }

        var subject = await subjectRepository.GetByCodeAsync(normalized, cancellationToken);
        return subject ?? throw new NotFoundException($"Subject '{normalized}' was not found.");
    }

    public static void ApplySubject(Exam exam, Subject subject)
    {
        exam.SubjectCode = subject.Code;
    }
}
