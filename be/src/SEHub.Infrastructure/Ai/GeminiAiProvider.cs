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
    private static readonly string[] FallbackModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
    private const int MaxAttemptsPerModel = 2;

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

        var primaryModel = string.IsNullOrWhiteSpace(_settings.Model) ? "gemini-2.0-flash" : _settings.Model.Trim();
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

        Exception? lastException = null;

        foreach (var model in BuildModelChain(primaryModel))
        {
            for (var attempt = 0; attempt < MaxAttemptsPerModel; attempt++)
            {
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

                    if (!model.Equals(primaryModel, StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogWarning(
                            "Gemini fallback succeeded. Primary={PrimaryModel}, Used={UsedModel}",
                            primaryModel,
                            model);
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
                catch (Exception exception) when (IsQuotaExceededError(exception))
                {
                    _logger.LogWarning(exception, "Gemini API quota exceeded. Model={Model}", model);
                    throw new AiProviderException(MapUserMessage(exception));
                }
                catch (Exception exception) when (IsTransientError(exception) && attempt < MaxAttemptsPerModel - 1)
                {
                    lastException = exception;
                    _logger.LogWarning(
                        exception,
                        "Gemini transient error. Model={Model}, Attempt={Attempt}",
                        model,
                        attempt + 1);
                    await Task.Delay(TimeSpan.FromMilliseconds(500 * (attempt + 1)), cancellationToken);
                }
                catch (Exception exception) when (IsTransientError(exception))
                {
                    lastException = exception;
                    _logger.LogWarning(
                        exception,
                        "Gemini transient error exhausted retries. Model={Model}",
                        model);
                    break;
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception, "Gemini SDK generateContent failed. Model={Model}", model);
                    throw new AiProviderException(MapUserMessage(exception));
                }
            }
        }

        _logger.LogError(
            lastException,
            "Gemini failed across all models. Primary={PrimaryModel}",
            primaryModel);
        throw new AiProviderException(MapUserMessage(lastException));
    }

    private static IEnumerable<string> BuildModelChain(string primaryModel)
    {
        yield return primaryModel;

        foreach (var fallback in FallbackModels)
        {
            if (!fallback.Equals(primaryModel, StringComparison.OrdinalIgnoreCase))
            {
                yield return fallback;
            }
        }
    }

    private static bool IsQuotaExceededError(Exception exception)
    {
        var message = exception.Message;
        return message.Contains("exceeded your current quota", StringComparison.OrdinalIgnoreCase)
            || message.Contains("free_tier", StringComparison.OrdinalIgnoreCase)
            || message.Contains("QuotaFailure", StringComparison.OrdinalIgnoreCase)
            || message.Contains("quota metric", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsTransientError(Exception exception)
    {
        if (IsQuotaExceededError(exception))
        {
            return false;
        }

        var message = exception.Message;
        return message.Contains("high demand", StringComparison.OrdinalIgnoreCase)
            || message.Contains("UNAVAILABLE", StringComparison.OrdinalIgnoreCase)
            || message.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase)
            || message.Contains("overloaded", StringComparison.OrdinalIgnoreCase)
            || message.Contains("503", StringComparison.Ordinal)
            || message.Contains("429", StringComparison.Ordinal)
            || message.Contains("rate limit", StringComparison.OrdinalIgnoreCase);
    }

    private static string MapUserMessage(Exception? exception)
    {
        if (exception is null)
        {
            return "Gemini API tạm thời không phản hồi. Vui lòng thử lại sau vài giây.";
        }

        if (exception.Message.Contains("401", StringComparison.Ordinal)
            || exception.Message.Contains("UNAUTHENTICATED", StringComparison.OrdinalIgnoreCase))
        {
            return "Gemini API key không hợp lệ. Kiểm tra Ai:ApiKey trong appsettings.Development.Local.json.";
        }

        if (IsQuotaExceededError(exception))
        {
            return "Đã hết quota miễn phí của Gemini API key. Tạo key mới tại Google AI Studio (aistudio.google.com/apikey) hoặc thử lại sau khi quota reset.";
        }

        if (IsTransientError(exception))
        {
            return "Gemini đang quá tải tạm thời. Vui lòng bấm Thử lại sau vài giây.";
        }

        return $"Gemini API lỗi: {exception.Message}";
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
