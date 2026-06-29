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

        _context.QuestionAttachments.Add(attachment);
        return attachment;
    }
}
