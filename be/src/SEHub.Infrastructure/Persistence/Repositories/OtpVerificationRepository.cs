using Microsoft.EntityFrameworkCore;

using SEHub.Application.Abstractions.Repositories;

using SEHub.Domain.Entities;

using SEHub.Domain.Enums;



namespace SEHub.Infrastructure.Persistence.Repositories;



public class OtpVerificationRepository : IOtpVerificationRepository

{

    private readonly SEHubDbContext _context;



    public OtpVerificationRepository(SEHubDbContext context) => _context = context;



    public Task<OtpVerification?> GetLatestByEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default) =>

        _context.OtpVerifications

            .Where(o => o.Email == email && o.Purpose == purpose && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)

            .OrderByDescending(o => o.CreatedAt)

            .FirstOrDefaultAsync(cancellationToken);



    public Task<OtpVerification?> GetLatestByPhoneAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken = default) =>

        _context.OtpVerifications

            .Where(o => o.Phone == phone && o.Purpose == purpose && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)

            .OrderByDescending(o => o.CreatedAt)

            .FirstOrDefaultAsync(cancellationToken);



    public Task<OtpVerification?> GetLatestAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default) =>

        GetLatestByEmailAsync(email, purpose, cancellationToken);



    public async Task AddAsync(OtpVerification otp, CancellationToken cancellationToken = default) =>

        await _context.OtpVerifications.AddAsync(otp, cancellationToken);



    public Task UpdateAsync(OtpVerification otp, CancellationToken cancellationToken = default)

    {

        _context.OtpVerifications.Update(otp);

        return Task.CompletedTask;

    }



    public async Task InvalidateAllByEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default)

    {

        var otps = await _context.OtpVerifications

            .Where(o => o.Email == email && o.Purpose == purpose && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)

            .ToListAsync(cancellationToken);

        foreach (var otp in otps)

        {

            otp.IsUsed = true;

            otp.UpdatedAt = DateTime.UtcNow;

        }

    }



    public async Task InvalidateAllByPhoneAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken = default)

    {

        var otps = await _context.OtpVerifications

            .Where(o => o.Phone == phone && o.Purpose == purpose && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)

            .ToListAsync(cancellationToken);

        foreach (var otp in otps)

        {

            otp.IsUsed = true;

            otp.UpdatedAt = DateTime.UtcNow;

        }

    }



    public Task InvalidateAllAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default) =>

        InvalidateAllByEmailAsync(email, purpose, cancellationToken);



    public Task<int> CountRequestsByEmailSinceAsync(string email, OtpPurpose purpose, DateTime sinceUtc, CancellationToken cancellationToken = default) =>

        _context.OtpVerifications.CountAsync(

            o => o.Email == email && o.Purpose == purpose && o.CreatedAt >= sinceUtc,

            cancellationToken);



    public Task<int> CountRequestsByPhoneSinceAsync(string phone, OtpPurpose purpose, DateTime sinceUtc, CancellationToken cancellationToken = default) =>

        _context.OtpVerifications.CountAsync(

            o => o.Phone == phone && o.Purpose == purpose && o.CreatedAt >= sinceUtc,

            cancellationToken);



    public Task<DateTime?> GetLatestCreatedAtByEmailAsync(string email, OtpPurpose purpose, CancellationToken cancellationToken = default) =>

        _context.OtpVerifications

            .Where(o => o.Email == email && o.Purpose == purpose)

            .OrderByDescending(o => o.CreatedAt)

            .Select(o => (DateTime?)o.CreatedAt)

            .FirstOrDefaultAsync(cancellationToken);



    public Task<DateTime?> GetLatestCreatedAtByPhoneAsync(string phone, OtpPurpose purpose, CancellationToken cancellationToken = default) =>

        _context.OtpVerifications

            .Where(o => o.Phone == phone && o.Purpose == purpose)

            .OrderByDescending(o => o.CreatedAt)

            .Select(o => (DateTime?)o.CreatedAt)

            .FirstOrDefaultAsync(cancellationToken);

}


