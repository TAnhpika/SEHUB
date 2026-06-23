using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public sealed class OcrExamService : IOcrExamService
{
    private readonly IExamRepository _examRepository;

    public OcrExamService(IExamRepository examRepository)
    {
        _examRepository = examRepository;
    }

    public async Task<OcrExamResponse> ProcessAsync(OcrExamRequest request, CancellationToken cancellationToken = default)
    {
        // Stub OCR: treat base64 payload as plain text source for normalization
        var rawText = request.Base64Image;
        var normalized = NormalizeText(rawText);
        var contentHash = ComputeSha256Hash(normalized);

        var duplicate = await _examRepository.GetByContentHashAsync(contentHash, cancellationToken);

        return new OcrExamResponse
        {
            Text = normalized,
            ContentHash = contentHash,
            DuplicateWarning = duplicate is not null,
            DuplicateExamId = duplicate?.Id
        };
    }

    internal static string NormalizeText(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var text = input.Trim().ToLowerInvariant();
        text = Regex.Replace(text, @"\s+", " ");
        return text;
    }

    internal static string ComputeSha256Hash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
