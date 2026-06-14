using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class ExamAttachmentRepository : IExamAttachmentRepository
{
    private readonly SEHubDbContext _context;

    public ExamAttachmentRepository(SEHubDbContext context) => _context = context;

    public Task<ExamAttachment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.ExamAttachments.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public async Task<IReadOnlyList<ExamAttachment>> GetByExamIdAsync(Guid examId, CancellationToken cancellationToken = default) =>
        await _context.ExamAttachments
            .Where(a => a.ExamId == examId)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(ExamAttachment attachment, CancellationToken cancellationToken = default) =>
        await _context.ExamAttachments.AddAsync(attachment, cancellationToken);

    public Task DeleteAsync(ExamAttachment attachment, CancellationToken cancellationToken = default)
    {
        _context.ExamAttachments.Remove(attachment);
        return Task.CompletedTask;
    }
}
