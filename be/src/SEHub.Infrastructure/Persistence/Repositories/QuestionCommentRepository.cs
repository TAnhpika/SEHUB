using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class QuestionCommentRepository : IQuestionCommentRepository
{
    private readonly SEHubDbContext _context;

    public QuestionCommentRepository(SEHubDbContext context) => _context = context;

    public Task<QuestionComment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.QuestionComments.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<IReadOnlyList<QuestionComment>> GetByQuestionIdAsync(
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken = default) =>
        await _context.QuestionComments
            .Where(c => c.ExamId == examId && c.QuestionId == questionId && c.ParentCommentId == null)
            .Include(c => c.Replies)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(QuestionComment comment, CancellationToken cancellationToken = default) =>
        await _context.QuestionComments.AddAsync(comment, cancellationToken);

    public Task SoftDeleteAsync(QuestionComment comment, Guid deletedById, CancellationToken cancellationToken = default)
    {
        comment.IsDeleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        comment.DeletedById = deletedById;
        _context.QuestionComments.Update(comment);
        return Task.CompletedTask;
    }
}
