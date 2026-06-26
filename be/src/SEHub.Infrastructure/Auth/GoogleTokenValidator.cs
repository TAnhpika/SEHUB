using System.Text;
using System.Text.Json;
using Google.Apis.Auth;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<GoogleTokenValidator> _logger;
    private readonly IHostEnvironment _environment;

    public GoogleTokenValidator(
        IOptions<GoogleAuthSettings> settings,
        ILogger<GoogleTokenValidator> logger,
        IHostEnvironment environment)
    {
        _settings = settings.Value;
        _logger = logger;
        _environment = environment;
    }

    public async Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var clientId = _settings.ClientId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(clientId))
        {
            _logger.LogWarning("Google login rejected: Google:ClientId is not configured.");
            throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
        }

        try
        {
            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId],
                // Máy dev thường lệch vài phút so với Google → "JWT is not yet valid".
                IssuedAtClockTolerance = TimeSpan.FromMinutes(5),
                ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5),
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
        catch (InvalidJwtException ex)
        {
            LogValidationFailure(clientId, idToken, ex.Message);
            throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
        }
        catch (ArgumentException ex)
        {
            LogValidationFailure(clientId, idToken, ex.Message);
            throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
        }
    }

    private void LogValidationFailure(string configuredClientId, string idToken, string reason)
    {
        if (!_environment.IsDevelopment())
        {
            return;
        }

        _logger.LogWarning(
            "Google ID token validation failed. Reason={Reason} ConfiguredClientId={ConfiguredClientId} TokenAudience={TokenAudience}",
            reason,
            configuredClientId,
            TryReadJwtAudience(idToken));
    }

    private static string? TryReadJwtAudience(string idToken)
    {
        try
        {
            var parts = idToken.Split('.');
            if (parts.Length < 2)
            {
                return null;
            }

            var payload = parts[1].Replace('-', '+').Replace('_', '/');
            var padding = payload.Length % 4;
            if (padding > 0)
            {
                payload = payload.PadRight(payload.Length + (4 - padding), '=');
            }

            using var document = JsonDocument.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(payload)));
            if (document.RootElement.TryGetProperty("aud", out var audience))
            {
                return audience.GetString();
            }

            return null;
        }
        catch
        {
            return null;
        }
    }
}
