using System.Security.Cryptography;

using System.Text;

using System.Text.Json;



namespace SEHub.Infrastructure.Payments;



internal static class PayOsSignatureHelper

{

    public static string CreateSignatureFromData(JsonElement data, string checksumKey)

    {

        if (data.ValueKind != JsonValueKind.Object)

        {

            return string.Empty;

        }



        var pairs = new SortedDictionary<string, string>(StringComparer.Ordinal);

        foreach (var property in data.EnumerateObject())

        {

            pairs[property.Name] = FormatValue(property.Value);

        }



        var dataString = string.Join("&", pairs.Select(kv => $"{kv.Key}={kv.Value}"));

        return ComputeHmacSha256Hex(dataString, checksumKey);

    }



    public static bool VerifySignature(JsonElement root, string providedSignature, string checksumKey)

    {

        if (!root.TryGetProperty("data", out var data))

        {

            return false;

        }



        var expected = CreateSignatureFromData(data, checksumKey);

        return CryptographicOperations.FixedTimeEquals(

            Encoding.UTF8.GetBytes(expected),

            Encoding.UTF8.GetBytes(providedSignature));

    }



    private static string FormatValue(JsonElement value) => value.ValueKind switch

    {

        JsonValueKind.Null => string.Empty,

        JsonValueKind.True => "true",

        JsonValueKind.False => "false",

        JsonValueKind.Number => value.GetRawText(),

        JsonValueKind.String => value.GetString() ?? string.Empty,

        _ => value.GetRawText()

    };



    private static string ComputeHmacSha256Hex(string data, string key)

    {

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));

        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));

        return Convert.ToHexString(hash).ToLowerInvariant();

    }

}

