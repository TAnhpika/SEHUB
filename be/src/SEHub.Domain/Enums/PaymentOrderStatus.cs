namespace SEHub.Domain.Enums;

public enum PaymentOrderStatus
{
    Pending,
    WaitingConfirmation,
    Paid,
    Failed,
    Cancelled,
    Expired,
    RefundRequested,
    ProcessingRefund,
    Refunded
}
