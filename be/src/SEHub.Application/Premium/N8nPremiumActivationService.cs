using System.Text.Json;
using FluentValidation;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Application.Models;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Premium;

public sealed class N8nPremiumActivationService : IN8nPremiumActivationService
{
    private static readonly Dictionary<string, string> PackagePlanCodeMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Gói 1 tháng"] = "1m",
            ["1 tháng"] = "1m",
            ["1 thang"] = "1m",
            ["1 Month"] = "1m",
            ["1m"] = "1m",
            ["Gói 8 tháng"] = "8m",
            ["8 tháng"] = "8m",
            ["8 thang"] = "8m",
            ["8 Months"] = "8m",
            ["8m"] = "8m",
            ["Gói 4 năm"] = "4y",
            ["4 năm"] = "4y",
            ["4 nam"] = "4y",
            ["4 Years"] = "4y",
            ["4y"] = "4y",
        };

    private readonly IUserRepository _userRepository;
    private readonly ISubscriptionPlanRepository _planRepository;
    private readonly IPaymentOrderRepository _orderRepository;
    private readonly IPaymentAuditLogRepository _auditLogRepository;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IPaymentConfirmationNotifier _paymentConfirmationNotifier;
    private readonly IPartnerVoucherService _partnerVoucherService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<N8NPremiumActivationDto> _validator;
    private readonly AiTokenLimitSettings _aiTokenLimits;

    public N8nPremiumActivationService(
        IUserRepository userRepository,
        ISubscriptionPlanRepository planRepository,
        IPaymentOrderRepository orderRepository,
        IPaymentAuditLogRepository auditLogRepository,
        ISubscriptionService subscriptionService,
        IPaymentConfirmationNotifier paymentConfirmationNotifier,
        IPartnerVoucherService partnerVoucherService,
        IUnitOfWork unitOfWork,
        IValidator<N8NPremiumActivationDto> validator,
        IOptions<AiTokenLimitSettings> aiTokenLimits)
    {
        _userRepository = userRepository;
        _planRepository = planRepository;
        _orderRepository = orderRepository;
        _auditLogRepository = auditLogRepository;
        _subscriptionService = subscriptionService;
        _paymentConfirmationNotifier = paymentConfirmationNotifier;
        _partnerVoucherService = partnerVoucherService;
        _unitOfWork = unitOfWork;
        _validator = validator;
        _aiTokenLimits = aiTokenLimits.Value;
    }

    public async Task<N8nPremiumActivationResultDto> ActivateAsync(
        N8NPremiumActivationDto request,
        CancellationToken cancellationToken = default)
    {
        await _validator.ValidateAndThrowAsync(request, cancellationToken);

        var user = await ResolveUserAsync(request, cancellationToken);
        var plan = await ResolvePlanAsync(request.PackageName, cancellationToken);
        var orderCode = request.OrderCode.Trim();

        var order = await _orderRepository.GetByPayOsOrderCodeAsync(orderCode, cancellationToken);
        var alreadyProcessed = false;

        if (order is not null)
        {
            if (order.UserId != user.Id)
            {
                throw new ConflictException("OrderCode is linked to another user.");
            }

            if (order.Status == PaymentOrderStatus.Paid)
            {
                alreadyProcessed = true;
            }
            else
            {
                order.Status = PaymentOrderStatus.Paid;
                order.Amount = request.Amount;
                order.PlanId = plan.Id;
                order.UpdatedAt = DateTime.UtcNow;
                await _orderRepository.UpdateAsync(order, cancellationToken);
            }
        }
        else
        {
            order = new PaymentOrder
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                PlanId = plan.Id,
                PayOsOrderCode = orderCode,
                Amount = request.Amount,
                Status = PaymentOrderStatus.Paid,
                ExpiredAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            await _orderRepository.AddAsync(order, cancellationToken);
        }

        if (!alreadyProcessed)
        {
            await _auditLogRepository.AddAsync(new PaymentAuditLog
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                Action = "N8N_ACTIVATE",
                PayloadJson = JsonSerializer.Serialize(request),
                CreatedAt = DateTime.UtcNow,
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _subscriptionService.ActivateSubscriptionAsync(user.Id, plan.Id, cancellationToken);
            await _partnerVoucherService.TryAssignForPaidOrderAsync(order.Id, cancellationToken);
        }

        var subscription = await _subscriptionService.GetStatusAsync(user.Id, cancellationToken);

        if (!alreadyProcessed)
        {
            await _paymentConfirmationNotifier.NotifyPaymentConfirmedAsync(
                new PaymentPaidNotification
                {
                    UserId = user.Id,
                    UserEmail = user.Email,
                    DisplayName = user.DisplayName,
                    OrderId = order.Id,
                    PayOsOrderCode = orderCode,
                    PlanId = plan.Id,
                    PlanName = subscription.PlanName ?? plan.Name,
                    AmountVnd = order.Amount,
                    PaidAt = DateTime.UtcNow,
                    ExpiresAt = subscription.ExpiresAt,
                },
                cancellationToken);
        }

        return new N8nPremiumActivationResultDto
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            DisplayName = user.DisplayName,
            IsPremium = subscription.IsActive,
            PlanName = subscription.PlanName ?? plan.Name,
            ExpiresAt = subscription.ExpiresAt,
            OrderCode = orderCode,
            Amount = order.Amount,
            AiDailyTokenLimit = subscription.IsActive
                ? _aiTokenLimits.DailyTokenLimitPremium
                : _aiTokenLimits.DailyTokenLimitFree,
            AlreadyProcessed = alreadyProcessed,
        };
    }

    private async Task<UserAccount> ResolveUserAsync(
        N8NPremiumActivationDto request,
        CancellationToken cancellationToken)
    {
        if (request.UserId.HasValue)
        {
            var byId = await _userRepository.GetByIdAsync(request.UserId.Value, cancellationToken);
            if (byId is not null)
            {
                return byId;
            }

            throw new NotFoundException("User", request.UserId.Value);
        }

        var username = request.Username?.Trim();
        if (string.IsNullOrWhiteSpace(username))
        {
            throw new ValidationException("Username or UserId is required.");
        }

        return await _userRepository.GetByUsernameAsync(username, cancellationToken)
            ?? throw new NotFoundException($"User '{username}' was not found.");
    }

    private async Task<SubscriptionPlan> ResolvePlanAsync(string packageName, CancellationToken cancellationToken)
    {
        var normalized = packageName.Trim();
        if (!PackagePlanCodeMap.TryGetValue(normalized, out var planCode))
        {
            throw new NotFoundException($"Package '{packageName}' was not found.");
        }

        return await _planRepository.GetByCodeAsync(planCode, cancellationToken)
            ?? throw new NotFoundException($"Subscription plan '{planCode}' was not found.");
    }
}
