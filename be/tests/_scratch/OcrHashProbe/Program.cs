using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

static string Normalize(string input)
{
    if (string.IsNullOrWhiteSpace(input)) return "";
    var t = input.Trim().ToLowerInvariant();
    return Regex.Replace(t, @"\s+", " ");
}

static string Hash(string input)
{
    return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLowerInvariant();
}

var q1 = "What is OOP?";
var q2 = "What is polymorphism?";
var sameOrder = Normalize(string.Join("|", new[] { q1, q2 }));
var swapped = Normalize(string.Join("|", new[] { q2, q1 }));

Console.WriteLine($"order_sensitive={Hash(sameOrder) != Hash(swapped)}");
Console.WriteLine($"hash_order_a={Hash(sameOrder)}");
Console.WriteLine($"hash_order_b={Hash(swapped)}");
Console.WriteLine($"empty={Hash(Normalize(""))}");
Console.WriteLine($"whitespace_empty={Hash(Normalize("   "))}");
Console.WriteLine($"empty_equal={Hash(Normalize("")) == Hash(Normalize("   "))}");
Console.WriteLine($"practice_asset_sensitive={Hash(Normalize("PRF192|Lab1|desc|http://a")) != Hash(Normalize("PRF192|Lab1|desc|http://b"))}");
Console.WriteLine($"punct_sensitive={Hash(Normalize("Hello!!!")) != Hash(Normalize("Hello"))}");
Console.WriteLine($"whitespace_ok={Hash(Normalize("  A   B  ")) == Hash(Normalize("a b"))}");
Console.WriteLine($"case_ok={Hash(Normalize("ABC")) == Hash(Normalize("abc"))}");
Console.WriteLine("nfc_note=Normalize does NOT call String.Normalize FormC");
Console.WriteLine("options_ignored_by_design=true");
Console.WriteLine("ocr_stub_hashes_raw_base64image_not_question_join=true");
