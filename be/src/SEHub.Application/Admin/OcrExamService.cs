using System.Text;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Admin;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Admin;

public sealed class OcrExamService : IOcrExamService
{
    private readonly IExamRepository _examRepository;
    private readonly IExamMarkdownImportService _markdownImport;

    public OcrExamService(
        IExamRepository examRepository,
        IExamMarkdownImportService markdownImport)
    {
        _examRepository = examRepository;
        _markdownImport = markdownImport;
    }

    public async Task<OcrExamResponse> ProcessAsync(OcrExamRequest request, CancellationToken cancellationToken = default)
    {
        var rawText = TryDecodeUtf8Payload(request.Base64Image) ?? request.Base64Image;
        if (string.IsNullOrWhiteSpace(rawText))
        {
            throw new DomainException("OCR payload is required.");
        }

        var parsed = _markdownImport.Parse(rawText);
        if (parsed.Questions.Count == 0)
        {
            throw new DomainException("Không parse được câu hỏi từ nội dung OCR.");
        }

        var contentHash = ExamContentFingerprint.ComputeHashFromQuestions(parsed.Questions);
        var duplicate = await _examRepository.GetByContentHashAsync(contentHash, cancellationToken);

        return new OcrExamResponse
        {
            Text = rawText.Trim(),
            ContentHash = contentHash,
            DuplicateWarning = duplicate is not null,
            DuplicateExamId = duplicate?.Id,
            Questions = parsed.Questions,
        };
    }

    private static string? TryDecodeUtf8Payload(string payload)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return null;
        }

        var base64 = payload.Trim();
        var commaIndex = base64.IndexOf(',');
        if (base64.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && commaIndex >= 0)
        {
            base64 = base64[(commaIndex + 1)..];
        }

        try
        {
            var bytes = Convert.FromBase64String(base64);
            return Encoding.UTF8.GetString(bytes);
        }
        catch (FormatException)
        {
            return null;
        }
    }
}
