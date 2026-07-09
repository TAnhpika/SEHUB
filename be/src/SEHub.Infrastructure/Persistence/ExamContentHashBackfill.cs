using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEHub.Application.Admin;
using SEHub.Domain.Exceptions;

namespace SEHub.Infrastructure.Persistence;

public static class ExamContentHashBackfill
{
    public static async Task RunAsync(SEHubDbContext db, ILogger logger, CancellationToken cancellationToken = default)
    {
        var exams = await db.Exams
            .Include(e => e.Questions)
            .ThenInclude(q => q.Options)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        var updated = 0;
        foreach (var exam in exams)
        {
            try
            {
                var newHash = ExamContentFingerprint.ComputeHashFromExam(exam);
                if (!string.Equals(exam.ContentHash, newHash, StringComparison.Ordinal))
                {
                    exam.ContentHash = newHash;
                    updated++;
                }
            }
            catch (DomainException)
            {
                logger.LogDebug("Skipping ContentHash backfill for exam {ExamId} — insufficient content.", exam.Id);
            }
        }

        if (updated > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Backfilled ContentHash for {Count} exam(s).", updated);
        }
    }
}
