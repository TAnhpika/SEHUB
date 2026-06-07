using SEHub.Application.Models;

namespace SEHub.Application.Auth;

public interface IJwtTokenService
{
    (string AccessToken, int ExpiresIn) GenerateAccessToken(UserAccount user, bool isPremium);
    string GenerateRefreshTokenValue();
}
