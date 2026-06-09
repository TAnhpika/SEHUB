using SEHub.Application.Models;

namespace SEHub.Application.Abstractions;

public interface IGoogleTokenValidator
{
    Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken cancellationToken = default);
}
