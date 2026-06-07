using SEHub.Domain.Entities;

using SEHub.Domain.Enums;



namespace SEHub.Application.Abstractions.Repositories;



public interface IOtpVerificationRepository

{

    Task<OtpVerification?> GetLatestByEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default);

    Task<OtpVerification?> GetLatestByPhoneAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken = default);

    Task AddAsync(OtpVerification otp, CancellationToken cancellationToken = default);

    Task UpdateAsync(OtpVerification otp, CancellationToken cancellationToken = default);

    Task InvalidateAllByEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default);

    Task InvalidateAllByPhoneAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken = default);

    Task<int> CountRequestsByEmailSinceAsync(string email, OtpPurpose purpose, DateTime sinceUtc, CancellationToken cancellationToken = default);

    Task<int> CountRequestsByPhoneSinceAsync(string phone, OtpPurpose purpose, DateTime sinceUtc, CancellationToken cancellationToken = default);

    Task<DateTime?> GetLatestCreatedAtByEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default);

    Task<DateTime?> GetLatestCreatedAtByPhoneAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken = default);



    [Obsolete("Use GetLatestByEmailAsync")]

    Task<OtpVerification?> GetLatestAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default);



    [Obsolete("Use InvalidateAllByEmailAsync")]

    Task InvalidateAllAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default);

}


