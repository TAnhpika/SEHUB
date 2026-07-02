using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Contracts.Gamification;
using SEHub.Domain.Enums;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/gamification")]
public sealed class GamificationController : ControllerBase
{
    private readonly IGamificationCatalogService _catalogService;
    private readonly IGamificationReadService _readService;
    private readonly ILeaderboardService _leaderboardService;
    private readonly IRankRewardVoucherRepository _voucherRepository;
    private readonly ICurrentUserService _currentUser;

    public GamificationController(
        IGamificationCatalogService catalogService,
        IGamificationReadService readService,
        ILeaderboardService leaderboardService,
        IRankRewardVoucherRepository voucherRepository,
        ICurrentUserService currentUser)
    {
        _catalogService = catalogService;
        _readService = readService;
        _leaderboardService = leaderboardService;
        _voucherRepository = voucherRepository;
        _currentUser = currentUser;
    }

    [HttpGet("badges")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBadges(CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetBadgesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("levels")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLevels(CancellationToken cancellationToken)
    {
        var result = await _catalogService.GetLevelsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyGamification(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var profile = await _readService.GetProfileGamificationAsync(userId, cancellationToken);
        return Ok(new GamificationProfileDto
        {
            Points = profile.Points,
            LevelName = profile.LevelName,
            NextLevelName = profile.NextLevelName,
            NextLevelPoints = profile.NextLevelPoints,
            ProgressPercent = profile.ProgressPercent,
            RemainingPoints = profile.RemainingPoints,
            CurrentStreak = profile.CurrentStreak,
            HighestStreak = profile.HighestStreak
        });
    }

    [HttpGet("me/daily-missions")]
    [Authorize]
    public async Task<IActionResult> GetMyDailyMissions(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var missions = await _readService.GetDailyMissionProgressAsync(userId, cancellationToken);
        return Ok(missions);
    }

    [HttpGet("leaderboard")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLeaderboard([FromQuery] int take = 20, CancellationToken cancellationToken = default)
    {
        var result = await _leaderboardService.GetTopAsync(Math.Clamp(take, 1, 100), cancellationToken);
        return Ok(result);
    }

    [HttpGet("vouchers")]
    [Authorize]
    public async Task<IActionResult> GetMyVouchers(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var vouchers = await _voucherRepository.GetByUserIdAsync(userId, cancellationToken);
        return Ok(vouchers.Select(v => new RankRewardVoucherDto
        {
            Id = v.Id,
            LevelName = v.Level?.Name,
            DiscountPercent = v.DiscountPercent,
            Status = v.Status.ToString(),
            ExpiresAt = v.ExpiresAt,
            GrantedAt = v.GrantedAt
        }));
    }
}
