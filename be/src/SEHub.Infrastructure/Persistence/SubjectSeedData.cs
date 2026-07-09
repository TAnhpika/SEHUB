using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Domain.Entities;
using SEHub.Shared.Subjects;

namespace SEHub.Infrastructure.Persistence;

public static class SubjectSeedData
{
    public static readonly IReadOnlyList<(int DisplayOrder, string Code, string Name, int Semester)> Catalog =
    [
        (7, "MAE101", "Mathematics for Engineering", 1),
        (8, "PRF192", "Programming Fundamentals", 1),
        (9, "CEA201", "Computer Organization and Architecture", 1),
        (10, "CSI104", "Connecting to Computer Science", 1),
        (11, "SSL101c", "Academic Skills for University Success", 1),
        (12, "MAD101", "Discrete mathematics", 2),
        (13, "OSG202", "Operating System", 2),
        (14, "PRO192", "Object-Oriented Programming", 2),
        (15, "SSG104", "Communication and In-Group Working Skills", 2),
        (16, "NWC204", "Computer Networking", 2),
        (17, "JPD113", "Elementary Japanese 1-A1.1", 3),
        (18, "WED201c", "WEB DESIGN", 3),
        (19, "DBI202", "Database Systems", 3),
        (20, "CSD201", "Data Structures and Algorithm", 3),
        (21, "LAB211", "OOP with Java Lab", 3),
        (22, "PRJ301", "Java Web Application Development", 4),
        (23, "SWE201c", "Introduction to Software Engineering", 4),
        (24, "MAS291", "Statistics & Probability", 4),
        (25, "JPD123", "Japanese Elementary 1-A1.2", 4),
        (26, "IOT102", "Internet of things", 4),
        (27, "SWP391", "Software development project", 5),
        (28, "WDU203c", "UI/UX Design", 5),
        (29, "SWR302", "Software Requirement", 5),
        (30, "SWT301", "Software Testing", 5),
        (31, "FER202", "Front-End web development with React", 5),
        (32, "ENW493c", "Research Methods & Academic Writing Skills", 6),
        (33, "OJT202", "On the Job training", 6),
        (34, "MMA301", "Multiplatform Mobile App Development", 7),
        (35, "PMG201c", "Project management", 7),
        (36, "SDN302", "Server-Side development with NodeJS, Express, and MongoDB", 7),
        (37, "EXE101", "Experiential Entrepreneurship 1", 7),
        (38, "SWD392", "SW Architecture and Design", 7),
        (39, "EXE201", "Experiential Entrepreneurship 2", 8),
        (40, "PRM393", "Mobile Programming", 8),
        (41, "ITE302c", "Ethics in IT", 8),
        (42, "WDP301", "Web Development Project", 8),
        (43, "MLN111", "Philosophy of Marxism – Leninism", 8),
        (44, "MLN122", "Political economics of Marxism – Leninism", 8),
        (45, "VNR202", "History of Viet Nam Communist Party", 9),
        (46, "SEP490", "SE Capstone Project", 9),
        (47, "MLN131", "Scientific Socialism", 9),
        (48, "HCM202", "Hochiminh Ideology", 9),
    ];

    public static async Task SyncAsync(SEHubDbContext context, ILogger logger)
    {
        var existing = await context.Subjects.ToDictionaryAsync(s => s.Code, StringComparer.Ordinal);
        var inserted = 0;
        var updated = 0;

        foreach (var (displayOrder, code, name, semester) in Catalog)
        {
            if (existing.TryGetValue(code, out var subject))
            {
                var changed = false;
                if (subject.DisplayOrder != displayOrder)
                {
                    subject.DisplayOrder = displayOrder;
                    changed = true;
                }

                if (!string.Equals(subject.Name, name, StringComparison.Ordinal))
                {
                    subject.Name = name;
                    changed = true;
                }

                if (subject.Semester != semester)
                {
                    subject.Semester = semester;
                    changed = true;
                }

                if (changed)
                {
                    updated++;
                }

                continue;
            }

            context.Subjects.Add(new Subject
            {
                Code = code,
                DisplayOrder = displayOrder,
                Name = name,
                Semester = semester,
            });
            inserted++;
        }

        if (inserted > 0 || updated > 0)
        {
            await context.SaveChangesAsync();
        }

        logger.LogInformation(
            "Subject catalog sync completed. Inserted={Inserted}, Updated={Updated}, Total={Total}",
            inserted,
            updated,
            Catalog.Count);

        await BackfillDocumentCategoriesAsync(context, logger);
    }

    private static async Task BackfillDocumentCategoriesAsync(SEHubDbContext context, ILogger logger)
    {
        var subjects = await context.Subjects.AsNoTracking().ToListAsync();
        if (subjects.Count == 0)
        {
            return;
        }

        var categories = await context.DocumentCategories
            .Where(category => category.SubjectCode == string.Empty)
            .ToListAsync();

        var updated = 0;
        foreach (var category in categories)
        {
            var subject = subjects.FirstOrDefault(candidate =>
                string.Equals(category.Name, candidate.Code, StringComparison.OrdinalIgnoreCase)
                || category.Name.StartsWith(candidate.Code + " ", StringComparison.OrdinalIgnoreCase)
                || category.Name.StartsWith(candidate.Code + "-", StringComparison.OrdinalIgnoreCase)
                || string.Equals(
                    SubjectCodeResolver.Resolve(category.Name),
                    candidate.Code,
                    StringComparison.OrdinalIgnoreCase));

            if (subject is null)
            {
                continue;
            }

            category.SubjectCode = subject.Code;
            category.Name = $"{subject.Code} — {subject.Name}";
            updated++;
        }

        if (updated > 0)
        {
            await context.SaveChangesAsync();
            logger.LogInformation("Backfilled SubjectCode for {Count} document categories", updated);
        }
    }
}
