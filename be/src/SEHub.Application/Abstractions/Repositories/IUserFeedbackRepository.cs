using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserFeedbackRepository
{
    Task<UserFeedback?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<UserFeedback> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        FeedbackStatus? status,
        CancellationToken cancellationToken = default);
    Task AddAsync(UserFeedback feedback, CancellationToken cancellationToken = default);
    Task UpdateAsync(UserFeedback feedback, CancellationToken cancellationToken = default);
}
