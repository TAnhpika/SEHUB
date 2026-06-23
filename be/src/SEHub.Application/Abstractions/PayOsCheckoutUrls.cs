namespace SEHub.Application.Abstractions;

public sealed class PayOsCheckoutUrls
{
    public string ReturnUrl { get; init; } = string.Empty;
    public string CancelUrl { get; init; } = string.Empty;
}
