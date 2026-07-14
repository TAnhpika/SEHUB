using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Infrastructure.Persistence;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class QuestionAttachmentRepository : IQuestionAttachmentRepository
{
    private readonly SEHubDbContext _context;

    public QuestionAttachmentRepository(SEHubDbContext context)
    {
        _context = context;
    }

    public Task<QuestionAttachment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.QuestionAttachments.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public async Task<IReadOnlyList<QuestionAttachment>> GetByQuestionIdAsync(
        Guid questionId,
        CancellationToken cancellationToken = default) =>
        await _context.QuestionAttachments
            .Where(a => a.QuestionId == questionId)
            .OrderBy(a => a.SortOrder)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<QuestionAttachment>> GetByQuestionIdsAsync(
        IReadOnlyList<Guid> questionIds,
        CancellationToken cancellationToken = default)
    {
        if (questionIds.Count == 0)
        {
            return [];
        }

        return await _context.QuestionAttachments
            .Where(a => questionIds.Contains(a.QuestionId))
            .OrderBy(a => a.QuestionId)
            .ThenBy(a => a.SortOrder)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> QuestionExistsAsync(Guid questionId, CancellationToken cancellationToken = default) =>
        _context.Questions.AnyAsync(q => q.Id == questionId, cancellationToken);

    public async Task<QuestionAttachment> AddAsync(
        Guid questionId,
        string publicId,
        string url,
        int sortOrder,
        CancellationToken cancellationToken = default)
    {
        var attachment = new QuestionAttachment
        {
            Id = Guid.NewGuid(),
            QuestionId = questionId,
            PublicId = publicId,
            Url = url,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow
        };

        await _context.QuestionAttachments.AddAsync(attachment, cancellationToken);
        return attachment;
    }

    public async Task AddRangeAsync(IEnumerable<QuestionAttachment> attachments, CancellationToken cancellationToken = default) =>
        await _context.QuestionAttachments.AddRangeAsync(attachments, cancellationToken);

    public Task DeleteRangeAsync(IEnumerable<QuestionAttachment> attachments, CancellationToken cancellationToken = default)
    {
        _context.QuestionAttachments.RemoveRange(attachments);
        return Task.CompletedTask;
    }
}
