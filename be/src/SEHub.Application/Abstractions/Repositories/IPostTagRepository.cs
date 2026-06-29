using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPostTagRepository
{
    Task SyncPostTagsAsync(Guid postId, IReadOnlyList<string> tagNames, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> GetTagNamesForPostAsync(Guid postId, CancellationToken cancellationToken = default);
    Task<IReadOnlyDictionary<Guid, IReadOnlyList<string>>> GetTagNamesForPostsAsync(
        IReadOnlyList<Guid> postIds,
        CancellationToken cancellationToken = default);
}

public interface IUserMissionProgressRepository
{
    Task<UserMissionProgress?> GetAsync(
        Guid userId,
        string missionCode,
        string periodKey,
        CancellationToken cancellationToken = default);

    Task<UserMissionProgress> IncrementAsync(
        Guid userId,
        string missionCode,
        string periodKey,
        int targetCount,
        CancellationToken cancellationToken = default);
}
