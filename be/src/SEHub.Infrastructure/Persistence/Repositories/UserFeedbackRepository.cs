using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserFeedbackRepository : IUserFeedbackRepository
{
    private readonly SEHubDbContext _context;

    public UserFeedbackRepository(SEHubDbContext context) => _context = context;

    public Task<UserFeedback?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.UserFeedbacks.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<UserFeedback> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        FeedbackStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserFeedbacks.AsQueryable();

        if (status is FeedbackStatus statusFilter)
        {
            query = query.Where(f => f.Status == statusFilter);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task AddAsync(UserFeedback feedback, CancellationToken cancellationToken = default) =>
        await _context.UserFeedbacks.AddAsync(feedback, cancellationToken);

    public Task UpdateAsync(UserFeedback feedback, CancellationToken cancellationToken = default)
    {
        _context.UserFeedbacks.Update(feedback);
        return Task.CompletedTask;
    }
}
