namespace SEHub.Application.Trust;

public static class TrustReasonClassifier
{
    public static string Classify(string? reasonText)
    {
        var text = (reasonText ?? string.Empty).ToLowerInvariant();
        if (text.Contains("spam") || text.Contains("quảng cáo") || text.Contains("quang cao"))
        {
            return "spam";
        }

        if (text.Contains("quấy") || text.Contains("quay") || text.Contains("bắt nạt")
            || text.Contains("bat nat") || text.Contains("harass"))
        {
            return "harassment";
        }

        if (text.Contains("sai") || text.Contains("fake") || text.Contains("lệch") || text.Contains("lech"))
        {
            return "misinformation";
        }

        if (text.Contains("độc") || text.Contains("doc") || text.Contains("toxic")
            || text.Contains("không phù hợp") || text.Contains("khong phu hop"))
        {
            return "inappropriate";
        }

        if (text.Contains("bản quyền") || text.Contains("ban quyen") || text.Contains("copyright"))
        {
            return "copyright";
        }

        return "other";
    }
}
