using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SEHub.Application.Gamification;

namespace SEHub.Infrastructure.Gamification;

public sealed class PointsReconciliationBackgroundService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromHours(24);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly GamificationSettings _settings;
    private readonly ILogger<PointsReconciliationBackgroundService> _logger;

    public PointsReconciliationBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<GamificationSettings> settings,
        ILogger<PointsReconciliationBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _settings = settings.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_settings.ReconcilePointsSchedule)
        {
            _logger.LogInformation("Points reconciliation schedule is disabled");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var reconciliation = scope.ServiceProvider.GetRequiredService<IPointsReconciliationService>();
                var drift = await reconciliation.ReconcileAllDriftAsync(
                    _settings.ApplyFixOnSchedule,
                    stoppingToken);

                if (drift.Count > 0)
                {
                    _logger.LogWarning(
                        "Points reconciliation found {Count} users with drift (applyFix={ApplyFix})",
                        drift.Count,
                        _settings.ApplyFixOnSchedule);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Points reconciliation job failed");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
