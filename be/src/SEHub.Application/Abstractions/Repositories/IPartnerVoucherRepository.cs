using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Abstractions.Repositories;

public interface IPartnerVoucherRepository
{
    Task<PartnerVoucherType?> GetTypeByCodeAsync(string typeCode, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartnerVoucherType>> GetAllTypesAsync(CancellationToken cancellationToken = default);
    Task<string?> GetTypeCodeForPlanAsync(string planCode, CancellationToken cancellationToken = default);
    Task<bool> ExistsCodeAsync(string code, CancellationToken cancellationToken = default);
    Task AddCodesAsync(IReadOnlyList<PartnerVoucherCode> codes, CancellationToken cancellationToken = default);
    Task<PartnerVoucherCode?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PartnerVoucherCode?> GetByPaymentOrderIdAsync(Guid paymentOrderId, CancellationToken cancellationToken = default);
    Task<PartnerVoucherCode?> TryClaimAvailableAsync(Guid typeId, CancellationToken cancellationToken = default);
    Task<(IReadOnlyList<PartnerVoucherCode> Items, int TotalCount)> ListAsync(
        string? status,
        string? typeCode,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PartnerVoucherCode>> GetAssignedByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Dictionary<string, int>> GetAvailableCountsByTypeAsync(CancellationToken cancellationToken = default);
    Task<Dictionary<string, int>> GetStatusCountsAsync(CancellationToken cancellationToken = default);
    Task UpdateAsync(PartnerVoucherCode code, CancellationToken cancellationToken = default);
}
