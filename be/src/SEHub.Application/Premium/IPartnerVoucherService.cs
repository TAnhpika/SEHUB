using SEHub.Contracts.Admin;
using SEHub.Contracts.Premium;

namespace SEHub.Application.Premium;

public interface IPartnerVoucherService
{
    Task TryAssignForPaidOrderAsync(Guid paymentOrderId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PartnerVoucherDto>> ListMyAsync(CancellationToken cancellationToken = default);

    Task<ImportPartnerVoucherResultDto> ImportAsync(
        ImportPartnerVoucherRequest request,
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    Task<AdminPartnerVoucherListResponse> AdminListAsync(
        string? status,
        string? typeCode,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<AdminPartnerVoucherListItemDto> ManualAssignAsync(
        AssignPartnerVoucherRequest request,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PartnerVoucherTypeDto>> ListTypesAsync(CancellationToken cancellationToken = default);

    Task<AdminPartnerVoucherInventoryStatsDto> GetInventoryStatsAsync(CancellationToken cancellationToken = default);
}
