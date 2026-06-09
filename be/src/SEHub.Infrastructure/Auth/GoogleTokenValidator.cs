using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Auth;
using SEHub.Application.Models;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Infrastructure.Auth;

public sealed class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly GoogleAuthSettings _settings;

    public GoogleTokenValidator(IOptions<GoogleAuthSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ClientId))
        {
            throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
        }

        try
        {
            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_settings.ClientId]
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, validationSettings);

            if (string.IsNullOrWhiteSpace(payload.Email))
            {
                throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
            }

            if (payload.EmailVerified != true)
            {
                throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
            }

            return new GoogleTokenPayload
            {
                Subject = payload.Subject,
                Email = payload.Email,
                Name = payload.Name ?? payload.Email.Split('@')[0],
                EmailVerified = true
            };
        }
        catch (InvalidJwtException)
        {
            throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
        }
        catch (ArgumentException)
        {
            throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
        }
    }
}
