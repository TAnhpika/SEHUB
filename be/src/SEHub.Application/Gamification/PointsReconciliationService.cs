using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Enums;

namespace SEHub.Application.Gamification;

public interface IPointsReconciliationService
{
    Task<PointsReconciliationResult> ReconcileUserAsync(Guid userId, bool applyFix, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PointsReconciliationResult>> ReconcileAllDriftAsync(bool applyFix, CancellationToken cancellationToken = default);
}

public sealed class PointsReconciliationResult
{
    public Guid UserId { get; init; }
    public int CachedPoints { get; init; }
    public int LedgerPoints { get; init; }
    public int Drift { get; init; }
    public bool Fixed { get; init; }
}

public sealed class PointsReconciliationService : IPointsReconciliationService
{
    private readonly IUserRepository _userRepository;
    private readonly IPointTransactionRepository _transactionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PointsReconciliationService(
        IUserRepository userRepository,
        IPointTransactionRepository pointTransactionRepository,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _transactionRepository = pointTransactionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PointsReconciliationResult> ReconcileUserAsync(
        Guid userId,
        bool applyFix,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        var ledgerPoints = await _transactionRepository.SumPostedPointsAsync(userId, cancellationToken);
        var drift = user.Points - ledgerPoints;
        var fixedDrift = false;

        if (applyFix && drift != 0)
        {
            await _userRepository.ApplyPointDeltaAsync(userId, -drift, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            fixedDrift = true;
        }

        return new PointsReconciliationResult
        {
            UserId = userId,
            CachedPoints = user.Points,
            LedgerPoints = ledgerPoints,
            Drift = drift,
            Fixed = fixedDrift
        };
    }

    public async Task<IReadOnlyList<PointsReconciliationResult>> ReconcileAllDriftAsync(
        bool applyFix,
        CancellationToken cancellationToken = default)
    {
        var results = new List<PointsReconciliationResult>();
        var page = 1;
        const int pageSize = 100;

        while (true)
        {
            var users = await _userRepository.GetPagedAsync(page, pageSize, search: null, cancellationToken);
            if (users.Count == 0)
            {
                break;
            }

            foreach (var user in users)
            {
                var result = await ReconcileUserAsync(user.Id, applyFix, cancellationToken);
                if (result.Drift != 0)
                {
                    results.Add(result);
                }
            }

            if (users.Count < pageSize)
            {
                break;
            }

            page++;
        }

        return results;
    }
}
