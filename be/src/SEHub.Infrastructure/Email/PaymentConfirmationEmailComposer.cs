using System.Globalization;
using SEHub.Contracts.Premium;

namespace SEHub.Infrastructure.Email;

public static class PaymentConfirmationEmailComposer
{
    public static string BuildSubject() => "SEHub - Xac nhan thanh toan Premium thanh cong";

    public static string BuildPlainText(PaymentConfirmationEmailMessage message)
    {
        var expiryLine = FormatExpiryLine(message.ExpiresAt);

        return $"""
            Xin chao {message.DisplayName},

            Cam on ban da nang cap goi Premium tren SEHub.

            Goi: {message.PlanName}
            So tien: {FormatVnd(message.AmountVnd)}
            Ma don: {message.OrderCode}
            {expiryLine}

            Truy cap SEHub: {message.AppHomeUrl}

            Tran trong,
            SEHub Team
            """;
    }

    public static string BuildHtml(PaymentConfirmationEmailMessage message)
    {
        var expiryHtml = message.ExpiresAt.HasValue
            ? $"<li><strong>Het han Premium:</strong> {FormatExpiryDate(message.ExpiresAt.Value)}</li>"
            : string.Empty;

        return $"""
            <p>Xin chao <strong>{System.Net.WebUtility.HtmlEncode(message.DisplayName)}</strong>,</p>
            <p>Cam on ban da thanh toan va kich hoat goi <strong>Premium</strong> tren SEHub.</p>
            <ul>
              <li><strong>Goi:</strong> {System.Net.WebUtility.HtmlEncode(message.PlanName)}</li>
              <li><strong>So tien:</strong> {FormatVnd(message.AmountVnd)}</li>
              <li><strong>Ma don:</strong> {System.Net.WebUtility.HtmlEncode(message.OrderCode)}</li>
              {expiryHtml}
            </ul>
            <p><a href="{System.Net.WebUtility.HtmlEncode(message.AppHomeUrl)}">Mo SEHub</a></p>
            <p>Tran trong,<br/>SEHub Team</p>
            """;
    }

    private static string FormatExpiryLine(DateTime? expiresAt) =>
        expiresAt.HasValue
            ? $"Het han Premium: {FormatExpiryDate(expiresAt.Value)}"
            : "Premium da duoc kich hoat tren tai khoan cua ban.";

    private static string FormatExpiryDate(DateTime expiresAt) =>
        expiresAt.ToLocalTime().ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture);

    private static string FormatVnd(decimal amount) =>
        amount.ToString("N0", CultureInfo.GetCultureInfo("vi-VN")) + " VND";
}
