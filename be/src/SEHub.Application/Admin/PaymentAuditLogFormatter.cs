using System.Globalization;
using System.Text.Json;

namespace SEHub.Application.Admin;

public static class PaymentAuditLogFormatter
{
    public static string FormatDetail(string action, string? payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson))
        {
            return GetActionFallback(action);
        }

        try
        {
            using var document = JsonDocument.Parse(payloadJson);
            return FormatFromJson(action, document.RootElement) ?? GetActionFallback(action);
        }
        catch (JsonException)
        {
            return payloadJson.Trim();
        }
    }

    private static string? FormatFromJson(string action, JsonElement root) =>
        action.Trim().ToUpperInvariant() switch
        {
            "ORDER_CREATED" => FormatOrderCreated(root),
            "WEBHOOK_PAID" => FormatWebhookPaid(root),
            "WEBHOOK_DUPLICATE_IGNORED" => FormatWebhookDuplicate(root),
            "WAITING_CONFIRMATION" => "Sinh viên báo đã chuyển khoản — chờ admin xác nhận",
            "PAYMENT_EXPIRED" => FormatPaymentExpired(root),
            "MANUALVERIFICATION" => FormatNotePayload(root, "Admin xác nhận thanh toán thủ công"),
            "ADMIN_CONFIRM" => FormatNotePayload(root, "Admin xác nhận thanh toán"),
            "N8N_ACTIVATE" => FormatN8nActivate(root),
            "REFUND_REQUEST" => FormatRefundRequest(root),
            "REFUND_APPROVED" => FormatRefundApproved(root),
            "REFUND_BANK_DETAILS" => FormatRefundBankDetails(root),
            "REFUND_COMPLETED" => FormatNotePayload(root, "Admin xác nhận hoàn tiền thành công"),
            _ => FormatGeneric(root),
        };

    private static string FormatOrderCreated(JsonElement root)
    {
        var planCode = TryGetString(root, "PlanCode", "planCode");
        var finalAmount = TryGetDecimal(root, "FinalAmount", "finalAmount");
        var originalAmount = TryGetDecimal(root, "OriginalAmount", "originalAmount");
        var discountPercent = TryGetInt(root, "DiscountPercent", "discountPercent");

        var planLabel = string.IsNullOrWhiteSpace(planCode) ? "đơn Premium" : $"gói {planCode}";

        if (finalAmount is null)
        {
            return $"Tạo {planLabel}";
        }

        if (discountPercent is > 0 && originalAmount is not null && originalAmount != finalAmount)
        {
            return $"Tạo {planLabel} — {FormatVnd(finalAmount.Value)} (giảm {discountPercent}% từ {FormatVnd(originalAmount.Value)})";
        }

        return $"Tạo {planLabel} — {FormatVnd(finalAmount.Value)}";
    }

    private static string FormatWebhookPaid(JsonElement root)
    {
        var data = TryGetObject(root, "data", "Data") ?? root;
        var amount = TryGetDecimal(data, "Amount", "amount");
        var orderCode = TryGetString(data, "OrderCode", "orderCode");
        var description = TryGetString(data, "Description", "description");
        var reference = TryGetString(data, "Reference", "reference");

        var parts = new List<string>();
        if (amount is not null)
        {
            parts.Add(FormatVnd(amount.Value));
        }

        if (!string.IsNullOrWhiteSpace(orderCode))
        {
            parts.Add($"mã đơn {orderCode}");
        }

        if (!string.IsNullOrWhiteSpace(description))
        {
            parts.Add(description);
        }

        if (!string.IsNullOrWhiteSpace(reference))
        {
            parts.Add($"mã tham chiếu {reference}");
        }

        return parts.Count > 0
            ? $"Thanh toán thành công — {string.Join(", ", parts)}"
            : "Thanh toán thành công qua PayOS";
    }

    private static string FormatWebhookDuplicate(JsonElement root)
    {
        var summary = FormatWebhookPaid(root);
        return summary.StartsWith("Thanh toán thành công", StringComparison.Ordinal)
            ? $"Webhook PayOS trùng lặp — bỏ qua ({summary.Replace("Thanh toán thành công — ", string.Empty)})"
            : "Webhook PayOS trùng lặp — bỏ qua";
    }

    private static string FormatPaymentExpired(JsonElement root)
    {
        var waitingAt = TryGetString(root, "WaitingConfirmationAt", "waitingConfirmationAt");
        if (!string.IsNullOrWhiteSpace(waitingAt))
        {
            return $"Đơn hết hạn xác nhận — chờ quá 24 giờ (từ {waitingAt})";
        }

        return "Đơn hết hạn xác nhận — chờ quá 24 giờ";
    }

    private static string FormatNotePayload(JsonElement root, string prefix)
    {
        var note = TryGetString(root, "Note", "note");
        return string.IsNullOrWhiteSpace(note) ? prefix : $"{prefix} — {note}";
    }

    private static string FormatN8nActivate(JsonElement root)
    {
        var orderCode = TryGetString(root, "OrderCode", "orderCode");
        var packageName = TryGetString(root, "PackageName", "packageName");
        var username = TryGetString(root, "Username", "username");
        var amount = TryGetDecimal(root, "Amount", "amount");

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(username))
        {
            parts.Add($"@{username}");
        }

        if (!string.IsNullOrWhiteSpace(packageName))
        {
            parts.Add(packageName);
        }

        if (amount is not null)
        {
            parts.Add(FormatVnd(amount.Value));
        }

        if (!string.IsNullOrWhiteSpace(orderCode))
        {
            parts.Add($"mã đơn {orderCode}");
        }

        return parts.Count > 0
            ? $"Kích hoạt Premium qua n8n — {string.Join(", ", parts)}"
            : "Kích hoạt Premium qua n8n";
    }

    private static string FormatRefundRequest(JsonElement root)
    {
        var reason = TryGetString(root, "Reason", "reason");
        var orderCode = TryGetString(root, "OrderCode", "orderCode");

        if (!string.IsNullOrWhiteSpace(reason) && !string.IsNullOrWhiteSpace(orderCode))
        {
            return $"Yêu cầu hoàn tiền đơn {orderCode} — lý do: {reason}";
        }

        if (!string.IsNullOrWhiteSpace(reason))
        {
            return $"Yêu cầu hoàn tiền — lý do: {reason}";
        }

        return "Yêu cầu hoàn tiền";
    }

    private static string FormatRefundApproved(JsonElement root)
    {
        var orderCode = TryGetString(root, "OrderCode", "orderCode");
        var note = TryGetString(root, "AdminNote", "adminNote");
        var days = TryGetInt(root, "DurationDaysRevoked", "durationDaysRevoked");

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(orderCode))
        {
            parts.Add($"đơn {orderCode}");
        }

        if (days is > 0)
        {
            parts.Add($"trừ {days} ngày Premium");
        }

        if (!string.IsNullOrWhiteSpace(note))
        {
            parts.Add($"ghi chú: {note}");
        }

        return parts.Count > 0
            ? $"Admin duyệt hoàn tiền — {string.Join(", ", parts)}"
            : "Admin duyệt hoàn tiền";
    }

    private static string FormatRefundBankDetails(JsonElement root)
    {
        var bankName = TryGetString(root, "BankName", "bankName");
        var accountNumber = TryGetString(root, "AccountNumber", "accountNumber");
        var accountName = TryGetString(root, "AccountName", "accountName");
        var orderCode = TryGetString(root, "OrderCode", "orderCode");

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(bankName))
        {
            parts.Add(bankName);
        }

        if (!string.IsNullOrWhiteSpace(accountNumber))
        {
            parts.Add($"STK {accountNumber}");
        }

        if (!string.IsNullOrWhiteSpace(accountName))
        {
            parts.Add(accountName);
        }

        var bankInfo = string.Join(" · ", parts);
        if (!string.IsNullOrWhiteSpace(orderCode) && !string.IsNullOrWhiteSpace(bankInfo))
        {
            return $"Gửi thông tin nhận hoàn tiền đơn {orderCode} — {bankInfo}";
        }

        return string.IsNullOrWhiteSpace(bankInfo)
            ? "Gửi thông tin nhận hoàn tiền"
            : $"Gửi thông tin nhận hoàn tiền — {bankInfo}";
    }

    private static string FormatGeneric(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object)
        {
            return root.ToString();
        }

        var parts = new List<string>();
        foreach (var property in root.EnumerateObject())
        {
            if (property.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array)
            {
                continue;
            }

            var value = property.Value.ToString();
            if (!string.IsNullOrWhiteSpace(value))
            {
                parts.Add($"{property.Name}: {value}");
            }
        }

        return parts.Count > 0 ? string.Join(" · ", parts) : GetActionFallback(string.Empty);
    }

    private static string GetActionFallback(string action) =>
        action.Trim().ToUpperInvariant() switch
        {
            "ORDER_CREATED" => "Tạo đơn thanh toán Premium",
            "WEBHOOK_PAID" => "PayOS xác nhận thanh toán",
            "WEBHOOK_DUPLICATE_IGNORED" => "Webhook PayOS trùng lặp — bỏ qua",
            "WAITING_CONFIRMATION" => "Chờ admin xác nhận thanh toán",
            "PAYMENT_EXPIRED" => "Đơn thanh toán hết hạn",
            "MANUALVERIFICATION" => "Admin xác nhận thanh toán thủ công",
            "ADMIN_CONFIRM" => "Admin xác nhận thanh toán",
            "N8N_ACTIVATE" => "Kích hoạt Premium qua n8n",
            "REFUND_REQUEST" => "Yêu cầu hoàn tiền",
            "REFUND_APPROVED" => "Admin duyệt hoàn tiền",
            "REFUND_BANK_DETAILS" => "Gửi thông tin nhận hoàn tiền",
            "REFUND_COMPLETED" => "Hoàn tiền thành công",
            _ => string.IsNullOrWhiteSpace(action) ? "—" : action.Replace("_", " ", StringComparison.Ordinal),
        };

    private static JsonElement? TryGetObject(JsonElement root, params string[] names)
    {
        foreach (var name in names)
        {
            if (root.TryGetProperty(name, out var element) && element.ValueKind == JsonValueKind.Object)
            {
                return element;
            }
        }

        return null;
    }

    private static string? TryGetString(JsonElement root, params string[] names)
    {
        foreach (var name in names)
        {
            if (!root.TryGetProperty(name, out var element))
            {
                continue;
            }

            if (element.ValueKind == JsonValueKind.String)
            {
                var value = element.GetString();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }
            else if (element.ValueKind is JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False)
            {
                return element.ToString();
            }
        }

        return null;
    }

    private static decimal? TryGetDecimal(JsonElement root, params string[] names)
    {
        foreach (var name in names)
        {
            if (!root.TryGetProperty(name, out var element))
            {
                continue;
            }

            if (element.ValueKind == JsonValueKind.Number && element.TryGetDecimal(out var number))
            {
                return number;
            }

            if (element.ValueKind == JsonValueKind.String
                && decimal.TryParse(element.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed))
            {
                return parsed;
            }
        }

        return null;
    }

    private static int? TryGetInt(JsonElement root, params string[] names)
    {
        foreach (var name in names)
        {
            if (!root.TryGetProperty(name, out var element))
            {
                continue;
            }

            if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var number))
            {
                return number;
            }
        }

        return null;
    }

    private static string FormatVnd(decimal amount) =>
        $"{amount:N0}đ".Replace(",", ".", StringComparison.Ordinal);
}
