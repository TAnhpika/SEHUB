using SEHub.Application.Models;

namespace SEHub.Application.Abstractions.Repositories;

public interface IUserRepository
{
    Task<UserAccount?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserAccount>> GetByIdsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByEmailOrUsernameAsync(string emailOrUsername, CancellationToken cancellationToken = default);
    Task<UserAccount?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default);
    Task ConfirmEmailAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpdatePhoneNumberAsync(Guid userId, string phone, CancellationToken cancellationToken = default);
    Task<UserAccount> CreateAsync(CreateUserModel model, CancellationToken cancellationToken = default);
    Task<UserAccount?> FindOrCreateGoogleUserAsync(string email, string displayName, CancellationToken cancellationToken = default);
    Task<bool> ValidatePasswordAsync(Guid userId, string password, CancellationToken cancellationToken = default);
    Task UpdatePasswordAsync(Guid userId, string newPassword, CancellationToken cancellationToken = default);
    Task<bool> IsCurrentlyBannedAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddPointsAsync(Guid userId, int points, CancellationToken cancellationToken = default);
    Task ApplyPointDeltaAsync(Guid userId, int delta, CancellationToken cancellationToken = default);
    Task<StreakUpdateResult> UpdateStreakOnActivityAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<StreakUpdateResult> UpdateQualifyingStreakAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> TryApplyDailyLoginBonusAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Guid?> RecalculateLevelAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserAccount>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default);
    Task<int> CountAsync(string? search, CancellationToken cancellationToken = default);
    Task<int> CountByRoleAsync(string role, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Guid>> GetUserIdsByRolesAsync(
        IReadOnlyList<string> roles,
        CancellationToken cancellationToken = default);
    Task UpdateBanAsync(Guid userId, bool isBanned, DateTime? banUntil, string? banReason, string? banType, CancellationToken cancellationToken = default);
    Task UpdateRoleAsync(Guid userId, string role, CancellationToken cancellationToken = default);
    Task GrantAiTokensAsync(Guid userId, int amount, CancellationToken cancellationToken = default);
    Task UpdateDisplayNameAsync(Guid userId, string displayName, CancellationToken cancellationToken = default);
    Task UpdateLastSeenAtAsync(Guid userId, DateTime lastSeenAtUtc, CancellationToken cancellationToken = default);
    Task<DateTime?> GetLastSeenAtAsync(Guid userId, CancellationToken cancellationToken = default);
}
