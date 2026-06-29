using SEHub.Shared.Subjects;

namespace SEHub.Application.UnitTests.Subjects;

public class ExamMajorResolverTests
{
    [Theory]
    [InlineData("SE", "FE-SWE201c-SU2026-1", "SE")]
    [InlineData("AI", "FE-CSD203-SU2026-1", "AI")]
    [InlineData("SWE201c", "FE-SWE201c-SU2026-1", "SE")]
    [InlineData("PRF192", "FE-PRF192-SU2026-1", "SE")]
    [InlineData("CSD203", "FE-CSD203-SU2026-1", "AI")]
    public void Normalize_maps_subject_codes_to_track_majors(string major, string code, string expected)
    {
        var result = ExamMajorResolver.Normalize(major, code);

        Assert.Equal(expected, result);
    }
}
