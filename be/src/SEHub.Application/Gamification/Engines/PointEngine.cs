using Microsoft.Extensions.Logging;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Models;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Gamification.Engines;

public sealed class PointEngine : IPointEngine
{
    private readonly IPointRuleRepository _pointRuleRepository;
    private readonly IPointTransactionRepository _transactionRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PointEngine> _logger;

    public PointEngine(
        IPointRuleRepository pointRuleRepository,
        IPointTransactionRepository transactionRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ILogger<PointEngine> logger)
    {
        _pointRuleRepository = pointRuleRepository;
        _transactionRepository = transactionRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PointAwardResult> AwardByEventTypeAsync(
        Guid userId,
        string eventType,
        string idempotencyKey,
        string sourceType,
        Guid? sourceId,
        CancellationToken cancellationToken = default)
    {
        if (await _userRepository.IsCurrentlyBannedAsync(userId, cancellationToken))
        {
            _logger.LogWarning(
                "Skip points for banned user {UserId} on event {EventType}",
                userId,
                eventType);
            return new PointAwardResult { Applied = false, Amount = 0, TotalPoints = 0 };
        }

        if (await _transactionRepository.ExistsByIdempotencyKeyAsync(idempotencyKey, cancellationToken))
        {
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            _logger.LogInformation(
                "Skip duplicate points award for {EventType} key {IdempotencyKey}",
                eventType,
                idempotencyKey);
            return new PointAwardResult
            {
                Applied = false,
                Amount = 0,
                TotalPoints = user?.Points ?? 0
            };
        }

        var rules = await _pointRuleRepository.GetActiveByEventTypeAsync(eventType, cancellationToken);
        var rule = rules.FirstOrDefault();
        if (rule is null || rule.Points == 0)
        {
            _logger.LogWarning(
                "No active point rule for event {EventType}; points not applied for user {UserId}",
                eventType,
                userId);
            return new PointAwardResult { Applied = false, Amount = 0, TotalPoints = 0 };
        }

        var amount = ApplyMultiplier(rule);
        await _transactionRepository.AddAsync(new PointTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RuleCode = rule.Code,
            Amount = amount,
            IdempotencyKey = idempotencyKey,
            SourceType = sourceType,
            SourceId = sourceId,
            Status = PointTransactionStatus.Posted,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _userRepository.ApplyPointDeltaAsync(userId, amount, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return new PointAwardResult
        {
            Applied = true,
            Amount = amount,
            TotalPoints = updated?.Points ?? 0,
            RuleCode = rule.Code
        };
    }

    public async Task<PointAwardResult> AwardFixedPointsAsync(
        Guid userId,
        int amount,
        string ruleCode,
        string idempotencyKey,
        string sourceType,
        Guid? sourceId,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0)
        {
            return new PointAwardResult { Applied = false, Amount = 0, TotalPoints = 0 };
        }

        if (await _userRepository.IsCurrentlyBannedAsync(userId, cancellationToken))
        {
            return new PointAwardResult { Applied = false, Amount = 0, TotalPoints = 0 };
        }

        if (await _transactionRepository.ExistsByIdempotencyKeyAsync(idempotencyKey, cancellationToken))
        {
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            return new PointAwardResult
            {
                Applied = false,
                Amount = 0,
                TotalPoints = user?.Points ?? 0
            };
        }

        await _transactionRepository.AddAsync(new PointTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RuleCode = ruleCode,
            Amount = amount,
            IdempotencyKey = idempotencyKey,
            SourceType = sourceType,
            SourceId = sourceId,
            Status = PointTransactionStatus.Posted,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _userRepository.ApplyPointDeltaAsync(userId, amount, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return new PointAwardResult
        {
            Applied = true,
            Amount = amount,
            TotalPoints = updated?.Points ?? 0,
            RuleCode = ruleCode
        };
    }

    public async Task<PointAwardResult> VoidByIdempotencyKeyAsync(
        Guid userId,
        string originalIdempotencyKey,
        string voidIdempotencyKey,
        string eventType,
        CancellationToken cancellationToken = default)
    {
        if (await _transactionRepository.ExistsByIdempotencyKeyAsync(voidIdempotencyKey, cancellationToken))
        {
            return new PointAwardResult { Applied = false, Amount = 0, TotalPoints = 0 };
        }

        var original = await _transactionRepository.GetByIdempotencyKeyAsync(originalIdempotencyKey, cancellationToken);
        if (original is null || original.Status != PointTransactionStatus.Posted)
        {
            return await AwardByEventTypeAsync(userId, eventType, voidIdempotencyKey, "void", original?.SourceId, cancellationToken);
        }

        await _transactionRepository.VoidByIdempotencyKeyAsync(originalIdempotencyKey, cancellationToken);
        await _userRepository.ApplyPointDeltaAsync(userId, -original.Amount, cancellationToken);

        await _transactionRepository.AddAsync(new PointTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RuleCode = original.RuleCode,
            Amount = -original.Amount,
            IdempotencyKey = voidIdempotencyKey,
            SourceType = "void",
            SourceId = original.SourceId,
            Status = PointTransactionStatus.Posted,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        var updated = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return new PointAwardResult
        {
            Applied = true,
            Amount = -original.Amount,
            TotalPoints = updated?.Points ?? 0,
            RuleCode = original.RuleCode
        };
    }

    private static int ApplyMultiplier(PointRule rule)
    {
        if (string.IsNullOrWhiteSpace(rule.MetadataJson))
        {
            return rule.Points;
        }

        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(rule.MetadataJson);
            if (doc.RootElement.TryGetProperty("multiplier", out var multiplier) &&
                multiplier.TryGetDouble(out var value))
            {
                return (int)Math.Round(rule.Points * value, MidpointRounding.AwayFromZero);
            }
        }
        catch (Exception)
        {
            /* use base points */
        }

        return rule.Points;
    }
}
