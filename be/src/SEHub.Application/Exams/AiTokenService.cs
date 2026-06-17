using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Contracts.Profiles;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

public sealed class AiTokenService : IAiTokenService
{
    private readonly IAiTokenUsageRepository _tokenUsageRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly AiTokenLimitSettings _settings;

    public AiTokenService(
        IAiTokenUsageRepository tokenUsageRepository,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IOptions<AiTokenLimitSettings> settings)
    {
        _tokenUsageRepository = tokenUsageRepository;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _settings = settings.Value;
    }

    public async Task<AiTokenStatusDto> GetStatusAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var limit = GetDailyLimitForUser(userId);
        var used = await _tokenUsageRepository.GetTodayConsumedAsync(userId, cancellationToken);
        var remaining = Math.Max(0, limit - used);
        var costExplain = _settings.TokenCostExplain;
        var costChat = _settings.TokenCostChat;

        return new AiTokenStatusDto
        {
            Limit = limit,
            Used = used,
            Remaining = remaining,
            CostExplain = costExplain,
            CostChat = costChat,
            CanExplain = remaining >= costExplain,
            CanChat = remaining >= costChat,
        };
    }

    public async Task EnsureCanConsumeAsync(Guid userId, int cost, CancellationToken cancellationToken = default)
    {
        var limit = GetDailyLimitForUser(userId);
        var consumed = await _tokenUsageRepository.GetTodayConsumedAsync(userId, cancellationToken);

        if (consumed + cost > limit)
        {
            throw new ForbiddenException(ErrorCodes.TokenLimitExceeded);
        }
    }

    public async Task<int> RecordConsumptionAsync(Guid userId, int cost, CancellationToken cancellationToken = default)
    {
        var limit = GetDailyLimitForUser(userId);
        var usage = await _tokenUsageRepository.GetTodayUsageAsync(userId, cancellationToken);

        if (usage is null)
        {
            usage = new AiTokenDailyUsage
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                UsageDate = DateOnly.FromDateTime(DateTime.UtcNow),
                TokensConsumed = cost,
                CreatedAt = DateTime.UtcNow,
            };
            await _tokenUsageRepository.AddAsync(usage, cancellationToken);
        }
        else
        {
            usage.TokensConsumed += cost;
            usage.UpdatedAt = DateTime.UtcNow;
            await _tokenUsageRepository.UpdateAsync(usage, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Math.Max(0, limit - usage.TokensConsumed);
    }

    private int GetDailyLimitForUser(Guid userId)
    {
        if (_currentUser.UserId == userId
            && (_currentUser.IsPremium || _currentUser.IsModeratorOrAdmin))
        {
            return _settings.DailyTokenLimitPremium;
        }

        if (_currentUser.UserId == userId)
        {
            return _settings.DailyTokenLimitFree;
        }

        return _settings.DailyTokenLimitFree;
    }
}
