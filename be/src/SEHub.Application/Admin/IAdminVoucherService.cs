using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IAdminVoucherService
{
    Task<AdminVoucherListResponse> ListAsync(
        string? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<AdminVoucherListItemDto> GrantAsync(
        GrantAdminVoucherRequest request,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(Guid id, CancellationToken cancellationToken = default);
}
