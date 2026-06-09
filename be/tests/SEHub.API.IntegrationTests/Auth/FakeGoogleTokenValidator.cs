using SEHub.Application.Abstractions;
using SEHub.Application.Models;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class FakeGoogleTokenValidator : IGoogleTokenValidator
{
    public const string ValidExistingToken = "valid-existing-token";
    public const string ValidNewUserToken = "valid-new-user-token";
    public const string InvalidToken = "invalid-token";
    public const string ExpiredToken = "expired-token";
    public const string WrongAudienceToken = "wrong-audience-token";
    public const string UnverifiedEmailToken = "unverified-email-token";

    public Task<GoogleTokenPayload> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        GoogleTokenPayload? payload = idToken switch
        {
            ValidExistingToken => new GoogleTokenPayload
            {
                Subject = "google-sub-existing",
                Email = CustomWebApplicationFactory.FreeUserEmail,
                Name = "Free User",
                EmailVerified = true
            },
            ValidNewUserToken => new GoogleTokenPayload
            {
                Subject = "google-sub-new",
                Email = "google-new@test.local",
                Name = "Google New User",
                EmailVerified = true
            },
            UnverifiedEmailToken => new GoogleTokenPayload
            {
                Subject = "google-sub-unverified",
                Email = "unverified@test.local",
                Name = "Unverified",
                EmailVerified = false
            },
            InvalidToken or ExpiredToken or WrongAudienceToken => null,
            _ => null
        };

        if (payload is null)
        {
            throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
        }

        if (!payload.EmailVerified)
        {
            throw new ForbiddenException(ErrorCodes.GoogleTokenInvalid);
        }

        return Task.FromResult(payload);
    }
}
