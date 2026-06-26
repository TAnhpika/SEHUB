using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Models;
using SEHub.Domain.Entities;

namespace SEHub.Application.Gamification.Engines;

public sealed class LevelEngine : ILevelEngine
{
    private readonly IUserRepository _userRepository;
    private readonly ILevelConfigRepository _levelRepository;
    private readonly IUserLevelHistoryRepository _levelHistoryRepository;
    private readonly IRewardEngine _rewardEngine;
    private readonly IUnitOfWork _unitOfWork;

    public LevelEngine(
        IUserRepository userRepository,
        ILevelConfigRepository levelRepository,
        IUserLevelHistoryRepository levelHistoryRepository,
        IRewardEngine rewardEngine,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _levelRepository = levelRepository;
        _levelHistoryRepository = levelHistoryRepository;
        _rewardEngine = rewardEngine;
        _unitOfWork = unitOfWork;
    }

    public async Task<LevelSnapshot> RecalculateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        var previousLevelId = user.LevelId;
        var newLevelId = await _userRepository.RecalculateLevelAsync(userId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (newLevelId.HasValue && newLevelId != previousLevelId)
        {
            var exists = await _levelHistoryRepository.ExistsForUserAndLevelAsync(userId, newLevelId.Value, cancellationToken);
            if (!exists)
            {
                await _levelHistoryRepository.AddAsync(new UserLevelHistory
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    LevelId = newLevelId.Value,
                    PointsAtPromotion = user.Points,
                    PromotedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await _rewardEngine.GrantLevelRewardsAsync(userId, newLevelId.Value, cancellationToken);
            }
        }

        return await BuildSnapshotAsync(userId, cancellationToken);
    }

    public async Task<LevelSnapshot> BuildSnapshotAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        var levels = await _levelRepository.GetAllOrderedAsync(cancellationToken);
        var current = levels.LastOrDefault(l => l.MinPoints <= user.Points) ?? levels.FirstOrDefault();
        var next = levels.FirstOrDefault(l => l.MinPoints > user.Points);

        var progress = 0m;
        var remaining = 0;
        if (current is not null && next is not null)
        {
            var span = next.MinPoints - current.MinPoints;
            var gained = user.Points - current.MinPoints;
            progress = span > 0 ? Math.Round((decimal)gained / span * 100m, 1) : 100m;
            remaining = Math.Max(0, next.MinPoints - user.Points);
        }
        else if (next is null)
        {
            progress = 100m;
            remaining = 0;
        }

        return new LevelSnapshot
        {
            LevelId = current?.Id,
            LevelName = current?.Name ?? user.LevelName,
            Points = user.Points,
            NextLevelPoints = next?.MinPoints,
            NextLevelName = next?.Name,
            ProgressPercent = progress,
            RemainingPoints = remaining
        };
    }
}
