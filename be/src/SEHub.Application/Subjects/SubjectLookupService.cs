using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Subjects;
using SEHub.Shared.Subjects;

namespace SEHub.Application.Subjects;

public interface ISubjectLookupService
{
    Task<SubjectDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
}

public sealed class SubjectLookupService : ISubjectLookupService
{
    private readonly ISubjectRepository _subjectRepository;

    public SubjectLookupService(ISubjectRepository subjectRepository) =>
        _subjectRepository = subjectRepository;

    public async Task<SubjectDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var subject = await _subjectRepository.GetByCodeAsync(code, cancellationToken);
        return subject is null ? null : Map(subject);
    }

    internal static SubjectDto Map(Domain.Entities.Subject subject) =>
        new()
        {
            Code = subject.Code,
            Name = subject.Name,
            Semester = subject.Semester,
            Major = ExamMajorResolver.Normalize(subject.Code, subject.Code),
        };
}
