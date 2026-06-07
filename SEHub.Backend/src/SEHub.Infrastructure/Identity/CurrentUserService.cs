using Microsoft.AspNetCore.Http;

using SEHub.Application.Abstractions;

using SEHub.Shared.Constants;

using System.Security.Claims;



namespace SEHub.Infrastructure.Identity;



public class CurrentUserService : ICurrentUserService

{

    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IPremiumStatusService _premiumStatusService;

    private bool? _cachedPremium;



    public CurrentUserService(IHttpContextAccessor httpContextAccessor, IPremiumStatusService premiumStatusService)

    {

        _httpContextAccessor = httpContextAccessor;

        _premiumStatusService = premiumStatusService;

    }



    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;



    public Guid? UserId

    {

        get

        {

            var id = User?.FindFirstValue(ClaimTypes.NameIdentifier)

                ?? User?.FindFirstValue("sub");

            return Guid.TryParse(id, out var userId) ? userId : null;

        }

    }



    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;



    public bool IsPremium

    {

        get

        {

            if (_cachedPremium.HasValue)

            {

                return _cachedPremium.Value;

            }



            if (UserId is not Guid userId)

            {

                _cachedPremium = false;

                return false;

            }



            _cachedPremium = _premiumStatusService.IsPremiumAsync(userId).GetAwaiter().GetResult();

            return _cachedPremium.Value;

        }

    }



    public bool IsModeratorOrAdmin =>

        User?.IsInRole(RoleNames.Moderator) == true || User?.IsInRole(RoleNames.Admin) == true;



    public string? Role

    {

        get

        {

            if (User?.IsInRole(RoleNames.Admin) == true) return RoleNames.Admin;

            if (User?.IsInRole(RoleNames.Moderator) == true) return RoleNames.Moderator;

            if (User?.IsInRole(RoleNames.Student) == true) return RoleNames.Student;

            return User?.FindFirstValue(ClaimTypes.Role);

        }

    }

}

