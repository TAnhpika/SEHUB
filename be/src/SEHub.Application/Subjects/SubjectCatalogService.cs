using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Subjects;

namespace SEHub.Application.Subjects;

public interface ISubjectCatalogService
{
    Task<IReadOnlyList<SubjectSemesterGroupDto>> GetCatalogAsync(CancellationToken cancellationToken = default);
}

public sealed class SubjectCatalogService : ISubjectCatalogService
{
    private readonly IExamRepository _examRepository;
    private readonly IDocumentCategoryRepository _categoryRepository;

    public SubjectCatalogService(
        IExamRepository examRepository,
        IDocumentCategoryRepository categoryRepository)
    {
        _examRepository = examRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<IReadOnlyList<SubjectSemesterGroupDto>> GetCatalogAsync(
        CancellationToken cancellationToken = default)
    {
        var examSubjects = await _examRepository.GetDistinctPublishedSubjectsAsync(cancellationToken);
        var categories = await _categoryRepository.GetAllAsync(cancellationToken);

        var entries = new Dictionary<(int Semester, string Code, string Major), (int Semester, string Code, string Major)>();

        foreach (var exam in examSubjects)
        {
            AddEntry(entries, exam.Semester, exam.Code, exam.Major);
        }

        foreach (var category in categories)
        {
            AddEntry(entries, category.Semester, category.Name, category.Major);
        }

        return entries.Values
            .GroupBy(entry => entry.Semester)
            .OrderBy(group => group.Key)
            .Select(group => new SubjectSemesterGroupDto
            {
                Semester = group.Key,
                Courses = group
                    .Select(item => new SubjectCourseDto
                    {
                        Code = item.Code,
                        Major = item.Major,
                    })
                    .OrderBy(course => course.Code, StringComparer.OrdinalIgnoreCase)
                    .ToList(),
            })
            .ToList();
    }

    private static void AddEntry(
        Dictionary<(int Semester, string Code, string Major), (int Semester, string Code, string Major)> entries,
        int semester,
        string code,
        string major)
    {
        var normalizedCode = code.Trim();
        var normalizedMajor = major.Trim();
        if (semester <= 0 || string.IsNullOrWhiteSpace(normalizedCode) || string.IsNullOrWhiteSpace(normalizedMajor))
        {
            return;
        }

        var key = (semester, normalizedCode, normalizedMajor);
        entries.TryAdd(key, key);
    }
}
