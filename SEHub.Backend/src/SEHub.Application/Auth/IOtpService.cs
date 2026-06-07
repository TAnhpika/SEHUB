using SEHub.Domain.Enums;



namespace SEHub.Application.Auth;



public interface IOtpService

{

    Task<string> GenerateAndSendAsync(string email, CancellationToken cancellationToken = default);

    Task<string> GenerateAndSendEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default);

    Task<string> GenerateAndSendSmsAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken = default);

    Task<bool> VerifyAsync(string email, string code, CancellationToken cancellationToken = default);

    Task<bool> VerifyEmailAsync(string email, string code, OtpPurpose purpose, bool markUsed, CancellationToken cancellationToken = default);

    Task<bool> VerifySmsAsync(string phone, string code, OtpPurpose purpose, bool markUsed, CancellationToken cancellationToken = default);

    Task ConsumeLatestEmailOtpAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default);

    string HashCode(string code);

}


