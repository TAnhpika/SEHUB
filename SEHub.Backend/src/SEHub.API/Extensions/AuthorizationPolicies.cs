using Microsoft.AspNetCore.Authorization;
using SEHub.Infrastructure.Identity;
using SEHub.Shared.Constants;

namespace SEHub.API.Extensions;

public static class AuthorizationPolicies
{
    public static IServiceCollection AddAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddAuthorizationBuilder()
            .AddPolicy(PolicyNames.RequireAuthenticated, policy => policy.RequireAuthenticatedUser())
            .AddPolicy(PolicyNames.RequirePremium, policy => policy
                .RequireAuthenticatedUser()
                .AddRequirements(new PremiumRequirement()))
            .AddPolicy(PolicyNames.RequireModerator, policy => policy
                .RequireAuthenticatedUser()
                .RequireRole(RoleNames.Moderator, RoleNames.Admin))
            .AddPolicy(PolicyNames.RequireAdmin, policy => policy
                .RequireAuthenticatedUser()
                .RequireRole(RoleNames.Admin));

        services.AddScoped<IAuthorizationHandler, PremiumAuthorizationHandler>();

        return services;
    }
}
