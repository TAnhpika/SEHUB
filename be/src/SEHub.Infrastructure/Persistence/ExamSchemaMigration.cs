using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;
using SEHub.Shared.Subjects;

namespace SEHub.Infrastructure.Persistence;

public static class ExamSchemaMigration
{
    private static async Task RepairOrphanExamSubjectsAsync(
        SEHubDbContext context,
        IReadOnlyDictionary<string, Subject> subjectByCode,
        ILogger logger)
    {
        var exams = await context.Exams.ToListAsync();
        var updated = 0;

        foreach (var exam in exams)
        {
            if (subjectByCode.TryGetValue(exam.SubjectCode, out var matchedSubject))
            {
                if (!string.Equals(exam.SubjectCode, matchedSubject.Code, StringComparison.Ordinal))
                {
                    exam.SubjectCode = matchedSubject.Code;
                    updated++;
                }

                continue;
            }

            if (string.Equals(exam.SubjectCode, "SE301", StringComparison.OrdinalIgnoreCase)
                && subjectByCode.TryGetValue("PRF192", out var prf192))
            {
                exam.SubjectCode = prf192.Code;
                updated++;
                continue;
            }

            var resolvedCode = SubjectCodeResolver.Resolve(exam.SubjectCode, exam.PaperCode)
                ?? SubjectCodeResolver.Resolve(exam.PaperCode);

            if (resolvedCode is not null
                && subjectByCode.TryGetValue(resolvedCode, out var resolvedSubject))
            {
                exam.SubjectCode = resolvedSubject.Code;
                updated++;
            }
        }

        if (updated > 0)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Repaired {Count} exams with orphan subject codes", updated);
        }
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
            .Where(exam => !context.Subjects.Any(subject => subject.Code.ToUpper() == exam.SubjectCode.ToUpper()))
            .Select(exam => exam.SubjectCode)
            .Distinct()
            .ToListAsync();

        if (orphanCodes.Count > 0)
        {
            logger.LogWarning(
                "Skipped Exams->Subjects foreign key; orphan subject codes remain: {Codes}",
                string.Join(", ", orphanCodes));
            return;
        }

        const string constraintName = "FK_Exams_Subjects_SubjectCode";
        await context.Database.ExecuteSqlRawAsync($"""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = '{constraintName}'
                ) THEN
                    ALTER TABLE "Exams"
                    ADD CONSTRAINT "{constraintName}"
                    FOREIGN KEY ("SubjectCode") REFERENCES "Subjects" ("Code")
                    ON DELETE RESTRICT;
                END IF;
            END $$;
            """);
        logger.LogInformation("Ensured exam subject foreign key");
    }
}
