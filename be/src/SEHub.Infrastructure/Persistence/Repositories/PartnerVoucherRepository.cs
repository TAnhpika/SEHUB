using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Infrastructure.Persistence.Repositories;

public sealed class PartnerVoucherRepository : IPartnerVoucherRepository
{
    private readonly SEHubDbContext _context;

    public PartnerVoucherRepository(SEHubDbContext context) => _context = context;

    public Task<PartnerVoucherType?> GetTypeByCodeAsync(string typeCode, CancellationToken cancellationToken = default) =>
        _context.PartnerVoucherTypes
            .FirstOrDefaultAsync(t => t.Code == typeCode, cancellationToken);

    public async Task<IReadOnlyList<PartnerVoucherType>> GetAllTypesAsync(CancellationToken cancellationToken = default) =>
        await _context.PartnerVoucherTypes
            .OrderBy(t => t.DiscountPercent)
            .ToListAsync(cancellationToken);

    public async Task<string?> GetTypeCodeForPlanAsync(string planCode, CancellationToken cancellationToken = default)
    {
        var reward = await _context.SubscriptionPlanPartnerRewards
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.PlanCode == planCode, cancellationToken);
        return reward?.PartnerVoucherTypeCode;
    }

    public Task<bool> ExistsCodeAsync(string code, CancellationToken cancellationToken = default) =>
        _context.PartnerVoucherCodes.AnyAsync(
            c => c.Code.ToLower() == code.ToLower(),
            cancellationToken);

    public async Task AddCodesAsync(IReadOnlyList<PartnerVoucherCode> codes, CancellationToken cancellationToken = default)
    {
        await _context.PartnerVoucherCodes.AddRangeAsync(codes, cancellationToken);
    }

    public Task<PartnerVoucherCode?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _context.PartnerVoucherCodes
            .Include(c => c.Type)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public Task<PartnerVoucherCode?> GetByPaymentOrderIdAsync(Guid paymentOrderId, CancellationToken cancellationToken = default) =>
        _context.PartnerVoucherCodes
            .Include(c => c.Type)
            .FirstOrDefaultAsync(c => c.PaymentOrderId == paymentOrderId, cancellationToken);

    public async Task<PartnerVoucherCode?> TryClaimAvailableAsync(Guid typeId, CancellationToken cancellationToken = default)
    {
        var code = await _context.PartnerVoucherCodes
            .Include(c => c.Type)
            .Where(c => c.TypeId == typeId && c.Status == PartnerVoucherStatus.Available)
            .OrderBy(c => c.ImportedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return code;
    }

    public async Task<(IReadOnlyList<PartnerVoucherCode> Items, int TotalCount)> ListAsync(
        string? status,
        string? typeCode,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.PartnerVoucherCodes
            .Include(c => c.Type)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status)
            && Enum.TryParse<PartnerVoucherStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(c => c.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(typeCode))
        {
            query = query.Where(c => c.Type != null && c.Type.Code == typeCode);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c => c.Code.ToLower().Contains(term));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(c => c.ImportedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<IReadOnlyList<PartnerVoucherCode>> GetAssignedByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await _context.PartnerVoucherCodes
            .Include(c => c.Type)
            .Where(c => c.AssignedUserId == userId)
            .OrderByDescending(c => c.AssignedAt)
            .ToListAsync(cancellationToken);

    public async Task<Dictionary<string, int>> GetAvailableCountsByTypeAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _context.PartnerVoucherCodes
            .Where(c => c.Status == PartnerVoucherStatus.Available)
            .GroupBy(c => c.TypeId)
            .Select(g => new { TypeId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var types = await _context.PartnerVoucherTypes
            .AsNoTracking()
            .ToDictionaryAsync(t => t.Id, t => t.Code, cancellationToken);

        return rows
            .Where(r => types.ContainsKey(r.TypeId))
            .ToDictionary(r => types[r.TypeId], r => r.Count);
    }

    public async Task<Dictionary<string, int>> GetStatusCountsAsync(CancellationToken cancellationToken = default)
    {
        var grouped = await _context.PartnerVoucherCodes
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return grouped.ToDictionary(
            g => g.Status.ToString().ToLowerInvariant(),
            g => g.Count);
    }

    public Task UpdateAsync(PartnerVoucherCode code, CancellationToken cancellationToken = default)
    {
        _context.PartnerVoucherCodes.Update(code);
        return Task.CompletedTask;
    }
}
