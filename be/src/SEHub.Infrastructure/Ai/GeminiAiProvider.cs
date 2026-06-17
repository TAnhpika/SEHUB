using Google.GenAI;
using Google.GenAI.Types;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Exams;
using SEHub.Domain.Exceptions;

namespace SEHub.Infrastructure.Ai;

public sealed class GeminiAiProvider : IAiProvider
{
    private readonly Client _client;
    private readonly AiTokenLimitSettings _settings;
    private readonly ILogger<GeminiAiProvider> _logger;

    public GeminiAiProvider(
        Client client,
        IOptions<AiTokenLimitSettings> settings,
        ILogger<GeminiAiProvider> logger)
    {
        _client = client;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<AiProviderResult> CompleteAsync(
        AiProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new InvalidOperationException("Ai:ApiKey is required for Gemini provider.");
        }

        var model = string.IsNullOrWhiteSpace(_settings.Model) ? "gemini-3.5-flash" : _settings.Model.Trim();
        var contents = request.Messages
            .Where(message => !string.IsNullOrWhiteSpace(message.Text))
            .Select(message => new Content
            {
                Role = MapRole(message.Role),
                Parts = [new Part { Text = message.Text.Trim() }],
            })
            .ToList();

        if (contents.Count == 0)
        {
            throw new AiProviderException("Không có nội dung tin nhắn để gửi tới Gemini.");
        }

        GenerateContentConfig? config = null;
        if (!string.IsNullOrWhiteSpace(request.SystemInstruction))
        {
            config = new GenerateContentConfig
            {
                SystemInstruction = new Content
                {
                    Parts = [new Part { Text = request.SystemInstruction.Trim() }],
                },
            };
        }

        try
        {
            var response = await _client.Models.GenerateContentAsync(
                model: model,
                contents: contents,
                config: config,
                cancellationToken: cancellationToken);

            var text = ExtractText(response);
            if (string.IsNullOrWhiteSpace(text))
            {
                throw new AiProviderException("Gemini API trả về phản hồi rỗng.");
            }

            var estimatedTokens = Math.Max(1, (text.Length + request.SystemInstruction.Length) / 4);

            return new AiProviderResult
            {
                Text = text.Trim(),
                EstimatedTokensUsed = estimatedTokens,
            };
        }
        catch (AiProviderException)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Gemini SDK generateContent failed. Model={Model}", model);
            throw new AiProviderException(
                exception.Message.Contains("401", StringComparison.Ordinal)
                || exception.Message.Contains("UNAUTHENTICATED", StringComparison.OrdinalIgnoreCase)
                    ? "Gemini API key không hợp lệ. Kiểm tra Ai:ApiKey trong appsettings.Development.Local.json."
                    : $"Gemini API lỗi: {exception.Message}");
        }
    }

    private static string MapRole(string role) =>
        role.Equals("assistant", StringComparison.OrdinalIgnoreCase)
        || role.Equals("model", StringComparison.OrdinalIgnoreCase)
            ? "model"
            : "user";

    private static string ExtractText(GenerateContentResponse response)
    {
        var candidate = response.Candidates?.FirstOrDefault();
        if (candidate?.Content?.Parts is null)
        {
            return string.Empty;
        }

        var builder = new System.Text.StringBuilder();
        foreach (var part in candidate.Content.Parts)
        {
            if (!string.IsNullOrWhiteSpace(part.Text))
            {
                builder.Append(part.Text);
            }
        }

        return builder.ToString();
    }
}
