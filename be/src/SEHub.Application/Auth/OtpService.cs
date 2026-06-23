using System.Security.Cryptography;

using System.Text;

using Microsoft.Extensions.Options;

using SEHub.Application.Abstractions;

using SEHub.Application.Abstractions.Repositories;

using SEHub.Domain.Entities;

using SEHub.Domain.Enums;

using SEHub.Domain.Exceptions;

using SEHub.Shared.Constants;



namespace SEHub.Application.Auth;



public sealed class OtpService : IOtpService

{

    private readonly IOtpVerificationRepository _otpRepository;

    private readonly IEmailService _emailService;

    private readonly ISmsService _smsService;

    private readonly IUnitOfWork _unitOfWork;

    private readonly OtpSettings _settings;



    public OtpService(

        IOtpVerificationRepository otpRepository,

        IEmailService emailService,

        ISmsService smsService,

        IUnitOfWork unitOfWork,

        IOptions<OtpSettings> settings)

    {

        _otpRepository = otpRepository;

        _emailService = emailService;

        _smsService = smsService;

        _unitOfWork = unitOfWork;

        _settings = settings.Value;

    }



    public Task<string> GenerateAndSendAsync(string email, CancellationToken cancellationToken = default) =>

        GenerateAndSendEmailAsync(email, OtpPurpose.ForgotPassword, cancellationToken);



    public async Task<string> GenerateAndSendEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default)

    {

        var normalizedEmail = NormalizeEmail(email);

        await EnsureCanSendEmailAsync(normalizedEmail, purpose, cancellationToken);



        var code = await CreateEmailOtpAsync(normalizedEmail, purpose, cancellationToken);

        await _emailService.SendOtpEmailAsync(normalizedEmail, code, cancellationToken);

        return code;

    }



    public async Task<string> GenerateAndSendSmsAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken = default)

    {

        var normalizedPhone = NormalizePhone(phone);

        await EnsureCanSendPhoneAsync(normalizedPhone, purpose, cancellationToken);



        var code = await CreatePhoneOtpAsync(normalizedPhone, purpose, cancellationToken);

        await _smsService.SendOtpSmsAsync(normalizedPhone, code, cancellationToken);

        return code;

    }



    public Task<bool> VerifyAsync(string email, string code, CancellationToken cancellationToken = default) =>

        VerifyEmailAsync(email, code, OtpPurpose.ForgotPassword, markUsed: false, cancellationToken);



    public Task<bool> VerifyEmailAsync(string email, string code, OtpPurpose purpose, bool markUsed, CancellationToken cancellationToken = default) =>

        VerifyInternalAsync(

            code,

            () => _otpRepository.GetLatestByEmailAsync(NormalizeEmail(email), purpose, cancellationToken),

            markUsed,

            cancellationToken);



    public Task<bool> VerifySmsAsync(string phone, string code, OtpPurpose purpose, bool markUsed, CancellationToken cancellationToken = default) =>

        VerifyInternalAsync(

            code,

            () => _otpRepository.GetLatestByPhoneAsync(NormalizePhone(phone), purpose, cancellationToken),

            markUsed,

            cancellationToken);



    public async Task ConsumeLatestEmailOtpAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default)

    {

        var otp = await _otpRepository.GetLatestByEmailAsync(NormalizeEmail(email), purpose, cancellationToken);

        if (otp is null)

        {

            return;

        }



        otp.IsUsed = true;

        otp.UpdatedAt = DateTime.UtcNow;

        await _otpRepository.UpdateAsync(otp, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

    }



    public string HashCode(string code)

    {

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));

        return Convert.ToHexString(bytes).ToLowerInvariant();

    }



    private async Task<string> CreateEmailOtpAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken)

    {

        await _otpRepository.InvalidateAllByEmailAsync(email, purpose, cancellationToken);



        var code = GenerateCode();

        var otp = new OtpVerification

        {

            Id = Guid.NewGuid(),

            Email = email,

            Phone = null,

            CodeHash = HashCode(code),

            ExpiresAt = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes),

            AttemptCount = 0,

            IsUsed = false,

            Purpose = purpose,

            CreatedAt = DateTime.UtcNow

        };



        await _otpRepository.AddAsync(otp, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return code;

    }



    private async Task<string> CreatePhoneOtpAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken)

    {

        await _otpRepository.InvalidateAllByPhoneAsync(phone, purpose, cancellationToken);



        var code = GenerateCode();

        var otp = new OtpVerification

        {

            Id = Guid.NewGuid(),

            Email = string.Empty,

            Phone = phone,

            CodeHash = HashCode(code),

            ExpiresAt = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes),

            AttemptCount = 0,

            IsUsed = false,

            Purpose = purpose,

            CreatedAt = DateTime.UtcNow

        };



        await _otpRepository.AddAsync(otp, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return code;

    }



    private async Task EnsureCanSendEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken)

    {

        var since = DateTime.UtcNow.AddHours(-1);

        var count = await _otpRepository.CountRequestsByEmailSinceAsync(email, purpose, since, cancellationToken);

        if (count >= _settings.MaxRequestsPerHour)

        {

            throw new ForbiddenException(ErrorCodes.OtpRateLimitExceeded);

        }



        var latestCreatedAt = await _otpRepository.GetLatestCreatedAtByEmailAsync(email, purpose, cancellationToken);

        if (latestCreatedAt.HasValue &&

            latestCreatedAt.Value.AddSeconds(_settings.ResendCooldownSeconds) > DateTime.UtcNow)

        {

            throw new ForbiddenException(ErrorCodes.OtpCooldown);

        }

    }



    private async Task EnsureCanSendPhoneAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken)

    {

        var since = DateTime.UtcNow.AddHours(-1);

        var count = await _otpRepository.CountRequestsByPhoneSinceAsync(phone, purpose, since, cancellationToken);

        if (count >= _settings.MaxRequestsPerHour)

        {

            throw new ForbiddenException(ErrorCodes.OtpRateLimitExceeded);

        }



        var latestCreatedAt = await _otpRepository.GetLatestCreatedAtByPhoneAsync(phone, purpose, cancellationToken);

        if (latestCreatedAt.HasValue &&

            latestCreatedAt.Value.AddSeconds(_settings.ResendCooldownSeconds) > DateTime.UtcNow)

        {

            throw new ForbiddenException(ErrorCodes.OtpCooldown);

        }

    }



    private async Task<bool> VerifyInternalAsync(

        string code,

        Func<Task<OtpVerification?>> getLatest,

        bool markUsed,

        CancellationToken cancellationToken)

    {

        var otp = await getLatest();

        if (otp is null || otp.ExpiresAt < DateTime.UtcNow || otp.IsUsed)

        {

            return false;

        }



        otp.AttemptCount++;

        if (otp.AttemptCount > _settings.MaxAttempts)

        {

            otp.IsUsed = true;

            otp.UpdatedAt = DateTime.UtcNow;

            await _otpRepository.UpdateAsync(otp, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            throw new ForbiddenException(ErrorCodes.OtpMaxAttempts);

        }



        var isValid = otp.CodeHash == HashCode(code);

        if (isValid && markUsed)

        {

            otp.IsUsed = true;

        }



        otp.UpdatedAt = DateTime.UtcNow;

        await _otpRepository.UpdateAsync(otp, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return isValid;

    }



    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();



    private static string NormalizePhone(string phone) => new string(phone.Where(char.IsDigit).ToArray());



    private static string GenerateCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

}


