using SEHub.Contracts.Premium;

namespace SEHub.Application.Premium;

public interface IPremiumRefundService
{
    Task<PremiumRefundResultDto> RequestRefundAsync(
        PremiumRefundRequestDto request,
        CancellationToken cancellationToken = default);

    Task<PremiumRefundResultDto> ApproveRefundAsync(
        Guid orderId,
        string? adminNote,
        CancellationToken cancellationToken = default);

    Task<PremiumRefundFormDto> GetRefundFormAsync(
        string orderCode,
        CancellationToken cancellationToken = default);

    Task<PremiumRefundResultDto> SubmitRefundBankDetailsAsync(
        PremiumRefundBankDetailsRequest request,
        IReadOnlyList<RefundPaymentProofUpload> paymentProofs,
        CancellationToken cancellationToken = default);

    Task<PremiumRefundResultDto> CompleteRefundAsync(
        Guid orderId,
        string? adminNote,
        CancellationToken cancellationToken = default);
}
