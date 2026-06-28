using Microsoft.AspNetCore.Authorization;
using SEHub.Application.Abstractions;
using SEHub.Shared.Constants;
using System.Security.Claims;

namespace SEHub.Infrastructure.Identity;

public class PremiumAuthorizationHandler : AuthorizationHandler<PremiumRequirement>
{
    private readonly IPremiumStatusService _premiumStatusService;

    public PremiumAuthorizationHandler(IPremiumStatusService premiumStatusService)
    {
        _premiumStatusService = premiumStatusService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PremiumRequirement requirement)
    {
        if (context.User.IsInRole(RoleNames.Admin) || context.User.IsInRole(RoleNames.Moderator))
        {
            context.Succeed(requirement);
            return;
        }

        var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue("sub");

        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return;
        }

        if (await _premiumStatusService.IsPremiumAsync(userId))
        {
            context.Succeed(requirement);
        }
    }
}
