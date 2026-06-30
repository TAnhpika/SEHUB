using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;
using SEHub.Shared.Subjects;

namespace SEHub.Infrastructure.Persistence;

public static class ExamSchemaMigration
{
    public static async Task MigrateLegacyExamCodesAsync(SEHubDbContext context, ILogger logger)
    {
        var subjects = await context.Subjects.AsNoTracking().ToListAsync();
        if (subjects.Count == 0)
        {
            return;
        }

        var subjectByCode = subjects.ToDictionary(subject => subject.Code, StringComparer.OrdinalIgnoreCase);
        var exams = await context.Exams.ToListAsync();
        var updated = 0;

        foreach (var exam in exams)
        {
            if (subjectByCode.ContainsKey(exam.Code) && LooksLikePaperCode(exam.Title))
            {
                var subject = subjectByCode[exam.Code];
                if (exam.Semester != subject.Semester)
                {
                    exam.Semester = subject.Semester;
                    updated++;
                }

                var major = ExamMajorResolver.Normalize(subject.Code, subject.Code);
                if (!string.Equals(exam.Major, major, StringComparison.Ordinal))
                {
                    exam.Major = major;
                    updated++;
                }

                continue;
            }

            var legacyPaperCode = exam.Code.Trim();
            var subjectCode = SubjectCodeResolver.Resolve(legacyPaperCode, exam.Title, exam.Major)
                ?? SubjectCodeResolver.Resolve(exam.Major)
                ?? SubjectCodeResolver.Resolve(exam.Title);

            if (subjectCode is null || !subjectByCode.TryGetValue(subjectCode, out var resolvedSubject))
            {
                continue;
            }

            var paperCode = LooksLikePaperCode(legacyPaperCode)
                ? legacyPaperCode
                : LooksLikePaperCode(exam.Title)
                    ? exam.Title.Trim()
                    : legacyPaperCode;

            exam.Code = resolvedSubject.Code;
            exam.Title = paperCode;
            exam.Semester = resolvedSubject.Semester;
            exam.Major = ExamMajorResolver.Normalize(resolvedSubject.Code, resolvedSubject.Code);
            updated++;
        }

        if (updated > 0)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Migrated {Count} exams to subject-code/paper-code schema", updated);
        }

        await RepairOrphanExamSubjectsAsync(context, subjectByCode, logger);
    }

    private static async Task RepairOrphanExamSubjectsAsync(
        SEHubDbContext context,
        IReadOnlyDictionary<string, Subject> subjectByCode,
        ILogger logger)
    {
        var exams = await context.Exams.ToListAsync();
        var updated = 0;

        foreach (var exam in exams)
        {
            if (subjectByCode.TryGetValue(exam.Code, out var matchedSubject))
            {
                if (!string.Equals(exam.Code, matchedSubject.Code, StringComparison.Ordinal))
                {
                    exam.Code = matchedSubject.Code;
                    exam.Semester = matchedSubject.Semester;
                    exam.Major = ExamMajorResolver.Normalize(matchedSubject.Code, matchedSubject.Code);
                    updated++;
                }

                continue;
            }

            if (string.Equals(exam.Code, "SE301", StringComparison.OrdinalIgnoreCase)
                && subjectByCode.TryGetValue("PRF192", out var prf192))
            {
                exam.Code = prf192.Code;
                exam.Semester = prf192.Semester;
                exam.Major = ExamMajorResolver.Normalize(prf192.Code, prf192.Code);
                updated++;
                continue;
            }

            var resolvedCode = SubjectCodeResolver.Resolve(exam.Code, exam.Title, exam.Major)
                ?? SubjectCodeResolver.Resolve(exam.Title)
                ?? SubjectCodeResolver.Resolve(exam.Major);

            if (resolvedCode is not null
                && subjectByCode.TryGetValue(resolvedCode, out var resolvedSubject))
            {
                exam.Code = resolvedSubject.Code;
                exam.Semester = resolvedSubject.Semester;
                exam.Major = ExamMajorResolver.Normalize(resolvedSubject.Code, resolvedSubject.Code);
                updated++;
            }
        }

        if (updated > 0)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Repaired {Count} exams with orphan subject codes", updated);
        }
    }

    private static bool LooksLikePaperCode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var trimmed = value.Trim();
        return trimmed.StartsWith("FE-", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("PE-", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("-FINAL-", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("-LAB-", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("-Rev", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("_", StringComparison.Ordinal)
            || trimmed.Contains("-ARCH-", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("-DEL-", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("MOD-", StringComparison.OrdinalIgnoreCase);
    }

    public static async Task EnsureSubjectForeignKeyAsync(SEHubDbContext context, ILogger logger)
    {
        var subjects = await context.Subjects.AsNoTracking().ToListAsync();
        if (subjects.Count > 0)
        {
            var subjectByCode = subjects.ToDictionary(subject => subject.Code, StringComparer.OrdinalIgnoreCase);
            await RepairOrphanExamSubjectsAsync(context, subjectByCode, logger);
        }

        var orphanCodes = await context.Exams
            .Where(exam => !context.Subjects.Any(subject => subject.Code.ToUpper() == exam.Code.ToUpper()))
            .Select(exam => exam.Code)
            .Distinct()
            .ToListAsync();

        if (orphanCodes.Count > 0)
        {
            logger.LogWarning(
                "Skipped Exams->Subjects foreign key; orphan subject codes remain: {Codes}",
                string.Join(", ", orphanCodes));
            return;
        }

        const string constraintName = "FK_Exams_Subjects_Code";
        await context.Database.ExecuteSqlRawAsync($"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = '{constraintName}'
                ) THEN
                    ALTER TABLE "Exams"
                    ADD CONSTRAINT "{constraintName}"
                    FOREIGN KEY ("Code") REFERENCES "Subjects" ("Code")
                    ON DELETE RESTRICT;
                END IF;
            END $$;
            """);
        logger.LogInformation("Ensured exam subject foreign key");
    }
}
