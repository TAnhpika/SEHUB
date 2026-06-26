using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEHub.Application.Models;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Infrastructure.Identity;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SEHubDbContext _context;

    public UserRepository(UserManager<ApplicationUser> userManager, SEHubDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    public async Task<UserAccount?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await MapUserAsync(await _userManager.FindByIdAsync(id.ToString()), cancellationToken);

    public async Task<IReadOnlyList<UserAccount>> GetByIdsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        var users = await _context.Users
            .Where(u => ids.Contains(u.Id))
            .ToListAsync(cancellationToken);

        var accounts = new List<UserAccount>(users.Count);
        foreach (var user in users)
        {
            var account = await MapUserAsync(user, cancellationToken);
            if (account is not null)
            {
                accounts.Add(account);
            }
        }

        return accounts;
    }

    public async Task<UserAccount?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        await MapUserAsync(await _userManager.FindByEmailAsync(email), cancellationToken);

    public async Task<UserAccount?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default) =>
        await MapUserAsync(await _userManager.FindByNameAsync(username), cancellationToken);

    public async Task<UserAccount?> GetByEmailOrUsernameAsync(string emailOrUsername, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(emailOrUsername)
            ?? await _userManager.FindByNameAsync(emailOrUsername);
        return await MapUserAsync(user, cancellationToken);
    }

    public async Task<UserAccount?> GetByPhoneAsync(string phone, CancellationToken cancellationToken = default)
    {
        var normalized = new string(phone.Where(char.IsDigit).ToArray());
        var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == normalized, cancellationToken);
        return await MapUserAsync(user, cancellationToken);
    }

    public async Task ConfirmEmailAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");
        user.EmailConfirmed = true;
        await _userManager.UpdateAsync(user);
    }

    public async Task UpdatePhoneNumberAsync(Guid userId, string phone, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");
        user.PhoneNumber = new string(phone.Where(char.IsDigit).ToArray());
        await _userManager.UpdateAsync(user);
    }

    public async Task<UserAccount> CreateAsync(CreateUserModel model, CancellationToken cancellationToken = default)
    {
        var level = await _context.LevelConfigs.OrderBy(l => l.MinPoints).FirstAsync(cancellationToken);
        var userId = Guid.NewGuid();

        var user = new ApplicationUser
        {
            Id = userId,
            UserName = model.Username,
            Email = model.Email,
            DisplayName = model.DisplayName,
            LevelId = level.Id,
            EmailConfirmed = model.EmailConfirmed
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            throw new DomainException(string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        await _userManager.AddToRoleAsync(user, RoleNames.Student);

        await _context.UserProfiles.AddAsync(new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        return (await MapUserAsync(user, cancellationToken))!;
    }

    public async Task<UserAccount?> FindOrCreateGoogleUserAsync(string email, string displayName, CancellationToken cancellationToken = default)
    {
        var existing = await GetByEmailAsync(email, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var username = email.Split('@')[0];
        var baseUsername = username;
        var suffix = 1;
        while (await _userManager.FindByNameAsync(username) is not null)
        {
            username = $"{baseUsername}{suffix++}";
        }

        return await CreateAsync(new CreateUserModel
        {
            Email = email,
            Username = username,
            Password = $"Google!{Guid.NewGuid():N}",
            DisplayName = displayName,
            EmailConfirmed = true
        }, cancellationToken);
    }

    public async Task<bool> ValidatePasswordAsync(Guid userId, string password, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user is not null && await _userManager.CheckPasswordAsync(user, password);
    }

    public async Task UpdatePasswordAsync(Guid userId, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
        {
            throw new DomainException(string.Join(" ", result.Errors.Select(e => e.Description)));
        }
    }

    public async Task<bool> IsCurrentlyBannedAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        return user is not null && user.IsBanned && (user.BanUntil is null || user.BanUntil > DateTime.UtcNow);
    }

    public async Task AddPointsAsync(Guid userId, int points, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        user.Points += points;

        var level = await _context.LevelConfigs
            .Where(l => l.MinPoints <= user.Points)
            .OrderByDescending(l => l.MinPoints)
            .FirstOrDefaultAsync(cancellationToken);
        if (level is not null)
        {
            user.LevelId = level.Id;
        }
    }

    public async Task ApplyPointDeltaAsync(Guid userId, int delta, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        user.Points = Math.Max(0, user.Points + delta);
        await RecalculateLevelInternalAsync(user, cancellationToken);
    }

    public Task<Guid?> RecalculateLevelAsync(Guid userId, CancellationToken cancellationToken = default) =>
        RecalculateLevelForUserAsync(userId, cancellationToken);

    private async Task<Guid?> RecalculateLevelForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        return await RecalculateLevelInternalAsync(user, cancellationToken);
    }

    private async Task<Guid?> RecalculateLevelInternalAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var level = await _context.LevelConfigs
            .Where(l => l.MinPoints <= user.Points)
            .OrderByDescending(l => l.MinPoints)
            .FirstOrDefaultAsync(cancellationToken);
        if (level is not null)
        {
            user.LevelId = level.Id;
            return level.Id;
        }

        return user.LevelId;
    }

    public async Task<StreakUpdateResult> UpdateQualifyingStreakAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var lastDate = user.LastActivityDate.HasValue
            ? DateOnly.FromDateTime(user.LastActivityDate.Value)
            : (DateOnly?)null;

        if (lastDate == today)
        {
            return new StreakUpdateResult(false, user.StreakCount);
        }

        var previousStreak = user.StreakCount;
        user.StreakCount = lastDate == today.AddDays(-1) ? user.StreakCount + 1 : 1;
        user.HighestStreak = Math.Max(user.HighestStreak, user.StreakCount);
        if (previousStreak > user.StreakCount)
        {
            user.HighestStreak = Math.Max(user.HighestStreak, previousStreak);
        }

        user.LastActivityDate = today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        return new StreakUpdateResult(true, user.StreakCount);
    }

    public async Task<bool> TryApplyDailyLoginBonusAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        var today = DateTime.UtcNow.Date;
        if (user.LastDailyLoginBonusAt?.Date == today)
        {
            return false;
        }

        user.LastDailyLoginBonusAt = today;
        return true;
    }

    public async Task<StreakUpdateResult> UpdateStreakOnActivityAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await UpdateQualifyingStreakAsync(userId, cancellationToken);

    public async Task<IReadOnlyList<UserAccount>> GetPagedAsync(int page, int pageSize, string? search, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u =>
                u.UserName!.Contains(search) ||
                u.Email!.Contains(search) ||
                u.DisplayName.Contains(search));
        }

        var users = await query
            .OrderBy(u => u.UserName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var result = new List<UserAccount>();
        foreach (var user in users)
        {
            var mapped = await MapUserAsync(user, cancellationToken);
            if (mapped is not null) result.Add(mapped);
        }

        return result;
    }

    public async Task<int> CountAsync(string? search, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u =>
                u.UserName!.Contains(search) ||
                u.Email!.Contains(search) ||
                u.DisplayName.Contains(search));
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<int> CountByRoleAsync(string role, CancellationToken cancellationToken = default)
    {
        var usersInRole = await _userManager.GetUsersInRoleAsync(role);
        return usersInRole.Count;
    }

    public async Task<IReadOnlyList<Guid>> GetUserIdsByRolesAsync(
        IReadOnlyList<string> roles,
        CancellationToken cancellationToken = default)
    {
        var ids = new HashSet<Guid>();

        foreach (var role in roles.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role);
            foreach (var user in usersInRole)
            {
                ids.Add(user.Id);
            }
        }

        return ids.ToList();
    }

    public async Task UpdateBanAsync(Guid userId, bool isBanned, DateTime? banUntil, string? banReason, string? banType, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        user.IsBanned = isBanned;
        user.BanUntil = banUntil;
        user.BanReason = banReason;
    }

    public async Task UpdateRoleAsync(Guid userId, string role, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, role);
    }

    public Task GrantAiTokensAsync(Guid userId, int amount, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public async Task UpdateDisplayNameAsync(Guid userId, string displayName, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        user.DisplayName = displayName;
    }

    private async Task<UserAccount?> MapUserAsync(ApplicationUser? user, CancellationToken cancellationToken)
    {
        if (user is null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.Contains(RoleNames.Admin) ? RoleNames.Admin
            : roles.Contains(RoleNames.Moderator) ? RoleNames.Moderator
            : RoleNames.Student;

        string? levelName = null;
        if (user.LevelId.HasValue)
        {
            levelName = await _context.LevelConfigs
                .Where(l => l.Id == user.LevelId.Value)
                .Select(l => l.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return new UserAccount
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            EmailConfirmed = user.EmailConfirmed,
            PhoneNumber = user.PhoneNumber,
            DisplayName = user.DisplayName,
            Role = role,
            IsBanned = user.IsBanned,
            BanUntil = user.BanUntil,
            BanReason = user.BanReason,
            Points = user.Points,
            LevelId = user.LevelId,
            LevelName = levelName,
            StreakCount = user.StreakCount,
            HighestStreak = user.HighestStreak,
            LastActivityDate = user.LastActivityDate,
            LastDailyLoginBonusAt = user.LastDailyLoginBonusAt,
            CreatedAt = DateTime.UtcNow
        };
    }
}
