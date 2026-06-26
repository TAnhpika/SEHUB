using MediatR;
using SEHub.Application.Gamification.Events;

namespace SEHub.Application.Gamification.Handlers;

public sealed record GamificationEventNotification(IGamificationEvent Event) : INotification;
