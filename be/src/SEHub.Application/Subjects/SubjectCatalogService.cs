using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Subjects;

namespace SEHub.Application.Subjects;

public interface ISubjectCatalogService
{
    Task<IReadOnlyList<SubjectSemesterGroupDto>> GetCatalogAsync(CancellationToken cancellationToken = default);
}

public sealed class SubjectCatalogService : ISubjectCatalogService
{
    private readonly ISubjectRepository _subjectRepository;

    public SubjectCatalogService(ISubjectRepository subjectRepository) =>
        _subjectRepository = subjectRepository;

    public async Task<IReadOnlyList<SubjectSemesterGroupDto>> GetCatalogAsync(
        CancellationToken cancellationToken = default)
    {
        var subjects = await _subjectRepository.GetAllAsync(cancellationToken);

        return subjects
            .GroupBy(subject => subject.Semester)
            .OrderBy(group => group.Key)
            .Select(group => new SubjectSemesterGroupDto
            {
                Semester = group.Key,
                Courses = group
                    .OrderBy(subject => subject.DisplayOrder)
                    .ThenBy(subject => subject.Code, StringComparer.OrdinalIgnoreCase)
                    .Select(subject =>
                    {
                        var mapped = SubjectLookupService.Map(subject);
                        return new SubjectCourseDto
                        {
                            Code = mapped.Code,
                            Name = mapped.Name,
                            Major = mapped.Major,
                        };
                    })
                    .ToList(),
            })
            .ToList();
    }
}
