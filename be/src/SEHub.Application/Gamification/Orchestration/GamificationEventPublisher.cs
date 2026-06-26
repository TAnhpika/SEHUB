using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Gamification.Abstractions;
using SEHub.Application.Gamification.Events;
using SEHub.Application.Gamification.Handlers;

namespace SEHub.Application.Gamification.Orchestration;

public sealed class GamificationEventPublisher : IGamificationEventPublisher
{
    private readonly IMediator _mediator;
    private readonly IGamificationEventInboxRepository _inboxRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly GamificationSettings _settings;
    private readonly ILogger<GamificationEventPublisher> _logger;

    public GamificationEventPublisher(
        IMediator mediator,
        IGamificationEventInboxRepository inboxRepository,
        IUnitOfWork unitOfWork,
        IOptions<GamificationSettings> settings,
        ILogger<GamificationEventPublisher> logger)
    {
        _mediator = mediator;
        _inboxRepository = inboxRepository;
        _unitOfWork = unitOfWork;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
        where TEvent : IGamificationEvent
    {
        if (!_settings.UseEngine)
        {
            _logger.LogDebug("Gamification engine disabled; skipping {EventType}", @event.EventType);
            return;
        }

        var payload = JsonSerializer.Serialize(@event);
        var acquired = await _inboxRepository.TryAcquireAsync(
            @event.IdempotencyKey,
            @event.EventType,
            payload,
            cancellationToken);

        if (!acquired)
        {
            return;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _mediator.Publish(new GamificationEventNotification(@event), cancellationToken);
    }
}
