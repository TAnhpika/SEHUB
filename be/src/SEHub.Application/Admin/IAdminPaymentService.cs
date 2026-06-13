using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Premium;

namespace SEHub.Application.Admin;

public interface IAdminPaymentService
{
    Task<PagedResult<PaymentListItemDto>> GetPaymentsAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<PaymentListItemDto> GetPaymentAsync(Guid id, CancellationToken cancellationToken = default);
    Task ConfirmPaymentAsync(Guid orderId, ConfirmPaymentRequest request, CancellationToken cancellationToken = default);
    Task<PremiumRefundResultDto> ApproveRefundAsync(Guid orderId, ApproveRefundRequest request, CancellationToken cancellationToken = default);
    Task<PagedResult<PaymentAuditLogDto>> GetAuditLogsAsync(int page, int pageSize, CancellationToken cancellationToken = default);
}
