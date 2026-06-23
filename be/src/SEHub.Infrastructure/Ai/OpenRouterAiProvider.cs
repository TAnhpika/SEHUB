using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SEHub.Application.Abstractions;
using SEHub.Application.Exams;
using SEHub.Domain.Exceptions;

namespace SEHub.Infrastructure.Ai;

public sealed class OpenRouterAiProvider : IAiProvider
{
    public const string HttpClientName = "OpenRouter";

    private static readonly string[] FallbackModels = [];
    private const int MaxAttemptsPerModel = 2;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AiTokenLimitSettings _settings;
    private readonly ILogger<OpenRouterAiProvider> _logger;

    public OpenRouterAiProvider(
        IHttpClientFactory httpClientFactory,
        IOptions<AiTokenLimitSettings> settings,
        ILogger<OpenRouterAiProvider> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<AiProviderResult> CompleteAsync(
        AiProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            throw new InvalidOperationException("Ai:ApiKey is required for OpenRouter provider.");
        }

        var messages = BuildMessages(request);
        if (messages.Count == 0)
        {
            throw new AiProviderException("Không có nội dung tin nhắn để gửi tới OpenRouter.");
        }

        var primaryModel = string.IsNullOrWhiteSpace(_settings.Model)
            ? "poolside/laguna-m.1:free"
            : _settings.Model.Trim();

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Clamp(_settings.RequestTimeoutSeconds, 30, 300)));

        Exception? lastException = null;

        foreach (var model in BuildModelChain(primaryModel))
        {
            for (var attempt = 0; attempt < MaxAttemptsPerModel; attempt++)
            {
                try
                {
                    var response = await SendChatCompletionAsync(model, messages, timeoutCts.Token);
                    var text = ExtractAssistantText(response.Choices?.FirstOrDefault()?.Message);

                    if (string.IsNullOrWhiteSpace(text))
                    {
                        lastException = new AiProviderException($"OpenRouter model {model} trả về phản hồi rỗng.");
                        _logger.LogWarning("OpenRouter empty response. Model={Model}", model);
                        break;
                    }

                    if (!model.Equals(primaryModel, StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogWarning(
                            "OpenRouter fallback succeeded. Primary={PrimaryModel}, Used={UsedModel}",
                            primaryModel,
                            model);
                    }

                    var estimatedTokens = response.Usage?.TotalTokens
                        ?? Math.Max(1, (text.Length + request.SystemInstruction.Length) / 4);

                    return new AiProviderResult
                    {
                        Text = text,
                        EstimatedTokensUsed = estimatedTokens,
                    };
                }
                catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                {
                    throw new AiProviderException(
                        $"OpenRouter phản hồi quá chậm (>{_settings.RequestTimeoutSeconds}s). Thử lại hoặc đổi model nhanh hơn.");
                }
                catch (Exception exception) when (IsQuotaExceededError(exception))
                {
                    _logger.LogWarning(exception, "OpenRouter API quota exceeded. Model={Model}", model);
                    throw new AiProviderException(MapUserMessage(exception));
                }
                catch (Exception exception) when (IsTransientError(exception) && attempt < MaxAttemptsPerModel - 1)
                {
                    lastException = exception;
                    _logger.LogWarning(
                        exception,
                        "OpenRouter transient error. Model={Model}, Attempt={Attempt}",
                        model,
                        attempt + 1);
                    await Task.Delay(TimeSpan.FromMilliseconds(500 * (attempt + 1)), timeoutCts.Token);
                }
                catch (Exception exception) when (IsTransientError(exception))
                {
                    lastException = exception;
                    _logger.LogWarning(
                        exception,
                        "OpenRouter transient error exhausted retries. Model={Model}",
                        model);
                    break;
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception, "OpenRouter chat completion failed. Model={Model}", model);
                    throw new AiProviderException(MapUserMessage(exception));
                }
            }
        }

        _logger.LogError(
            lastException,
            "OpenRouter failed across all models. Primary={PrimaryModel}",
            primaryModel);
        throw new AiProviderException(MapUserMessage(lastException));
    }

    private async Task<OpenRouterChatCompletionResponse> SendChatCompletionAsync(
        string model,
        IReadOnlyList<OpenRouterChatMessage> messages,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient(HttpClientName);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey.Trim());
        httpRequest.Headers.TryAddWithoutValidation("HTTP-Referer", ResolveHttpReferer());
        httpRequest.Headers.TryAddWithoutValidation("X-Title", ResolveSiteTitle());
        httpRequest.Content = JsonContent.Create(BuildRequestBody(model, messages));

        using var httpResponse = await client.SendAsync(httpRequest, cancellationToken);
        var body = await httpResponse.Content.ReadAsStringAsync(cancellationToken);

        if (!httpResponse.IsSuccessStatusCode)
        {
            var errorMessage = MapHttpError(httpResponse.StatusCode, body);
            if (httpResponse.StatusCode is HttpStatusCode.TooManyRequests
                or HttpStatusCode.ServiceUnavailable
                or HttpStatusCode.BadGateway
                or HttpStatusCode.GatewayTimeout)
            {
                throw new HttpRequestException(errorMessage, null, httpResponse.StatusCode);
            }

            throw new AiProviderException(errorMessage);
        }

        var parsed = System.Text.Json.JsonSerializer.Deserialize<OpenRouterChatCompletionResponse>(body);
        return parsed ?? throw new AiProviderException("OpenRouter API trả về JSON không hợp lệ.");
    }

    private OpenRouterChatCompletionRequest BuildRequestBody(string model, IReadOnlyList<OpenRouterChatMessage> messages)
    {
        var request = new OpenRouterChatCompletionRequest
        {
            Model = model,
            Messages = messages,
            MaxTokens = Math.Clamp(_settings.MaxTokens, 256, 4096),
        };

        if (RequiresRelaxedSampling(model))
        {
            request.Temperature = 1.0;
            request.TopP = 0.95;
        }

        return request;
    }

    private static bool RequiresRelaxedSampling(string model) =>
        model.Contains("nemotron", StringComparison.OrdinalIgnoreCase)
        || model.Contains("nex-n2", StringComparison.OrdinalIgnoreCase);

    private static string ExtractAssistantText(OpenRouterAssistantMessage? message)
    {
        if (message is null)
        {
            return string.Empty;
        }

        if (!string.IsNullOrWhiteSpace(message.Content))
        {
            return message.Content.Trim();
        }

        if (!string.IsNullOrWhiteSpace(message.Reasoning))
        {
            return message.Reasoning.Trim();
        }

        return string.Empty;
    }

    private static List<OpenRouterChatMessage> BuildMessages(AiProviderRequest request)
    {
        var messages = new List<OpenRouterChatMessage>();

        if (!string.IsNullOrWhiteSpace(request.SystemInstruction))
        {
            messages.Add(new OpenRouterChatMessage
            {
                Role = "system",
                Content = request.SystemInstruction.Trim(),
            });
        }

        foreach (var message in request.Messages.Where(message => !string.IsNullOrWhiteSpace(message.Text)))
        {
            messages.Add(new OpenRouterChatMessage
            {
                Role = MapRole(message.Role),
                Content = message.Text.Trim(),
            });
        }

        return messages;
    }

    private string ResolveHttpReferer()
    {
        return string.IsNullOrWhiteSpace(_settings.HttpReferer)
            ? "http://localhost:5173"
            : _settings.HttpReferer.Trim();
    }

    private string ResolveSiteTitle()
    {
        return string.IsNullOrWhiteSpace(_settings.SiteTitle)
            ? "SEHub"
            : _settings.SiteTitle.Trim();
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

    private static string MapRole(string role) =>
        role.Equals("assistant", StringComparison.OrdinalIgnoreCase)
        || role.Equals("model", StringComparison.OrdinalIgnoreCase)
            ? "assistant"
            : "user";

    private static bool IsQuotaExceededError(Exception exception)
    {
        var message = exception.Message;
        return message.Contains("insufficient credits", StringComparison.OrdinalIgnoreCase)
            || message.Contains("exceeded your current quota", StringComparison.OrdinalIgnoreCase)
            || message.Contains("quota", StringComparison.OrdinalIgnoreCase)
            || message.Contains("billing", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsTransientError(Exception exception)
    {
        if (IsQuotaExceededError(exception))
        {
            return false;
        }

        if (exception is HttpRequestException httpRequestException
            && httpRequestException.StatusCode is HttpStatusCode.TooManyRequests
                or HttpStatusCode.ServiceUnavailable
                or HttpStatusCode.GatewayTimeout
                or HttpStatusCode.BadGateway)
        {
            return true;
        }

        var message = exception.Message;
        return message.Contains("429", StringComparison.Ordinal)
            || message.Contains("503", StringComparison.Ordinal)
            || message.Contains("502", StringComparison.Ordinal)
            || message.Contains("504", StringComparison.Ordinal)
            || message.Contains("rate limit", StringComparison.OrdinalIgnoreCase)
            || message.Contains("overloaded", StringComparison.OrdinalIgnoreCase)
            || message.Contains("temporarily unavailable", StringComparison.OrdinalIgnoreCase);
    }

    private static string MapHttpError(HttpStatusCode statusCode, string body)
    {
        var detail = ExtractErrorMessage(body);
        var combined = string.IsNullOrWhiteSpace(detail) ? statusCode.ToString() : detail;
        return MapUserMessage(new AiProviderException(combined));
    }

    private static string ExtractErrorMessage(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return string.Empty;
        }

        try
        {
            var error = System.Text.Json.JsonSerializer.Deserialize<OpenRouterErrorResponse>(body);
            return error?.Error?.Message ?? body;
        }
        catch
        {
            return body;
        }
    }

    private static string MapUserMessage(Exception? exception)
    {
        if (exception is null)
        {
            return "OpenRouter API tạm thời không phản hồi. Vui lòng thử lại sau vài giây.";
        }

        var message = exception.Message;

        if (message.Contains("401", StringComparison.Ordinal)
            || message.Contains("Unauthorized", StringComparison.OrdinalIgnoreCase)
            || message.Contains("invalid api key", StringComparison.OrdinalIgnoreCase))
        {
            return "OpenRouter API key không hợp lệ. Kiểm tra Ai:ApiKey trong appsettings.Development.Local.json.";
        }

        if (IsQuotaExceededError(exception))
        {
            return "OpenRouter đã hết credit hoặc vượt quota. Kiểm tra số dư tại openrouter.ai hoặc đổi model rẻ hơn.";
        }

        if (IsTransientError(exception))
        {
            return "OpenRouter đang quá tải tạm thời. Vui lòng bấm Thử lại sau vài giây.";
        }

        return message.StartsWith("OpenRouter", StringComparison.OrdinalIgnoreCase)
            ? message
            : $"OpenRouter API lỗi: {message}";
    }

    private sealed class OpenRouterChatCompletionRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("messages")]
        public IReadOnlyList<OpenRouterChatMessage> Messages { get; set; } = Array.Empty<OpenRouterChatMessage>();

        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; }

        [JsonPropertyName("temperature")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public double? Temperature { get; set; }

        [JsonPropertyName("top_p")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public double? TopP { get; set; }
    }

    private sealed class OpenRouterChatMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = "user";

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    private sealed class OpenRouterChatCompletionResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenRouterChoice>? Choices { get; set; }

        [JsonPropertyName("usage")]
        public OpenRouterUsage? Usage { get; set; }
    }

    private sealed class OpenRouterChoice
    {
        [JsonPropertyName("message")]
        public OpenRouterAssistantMessage? Message { get; set; }
    }

    private sealed class OpenRouterAssistantMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [JsonPropertyName("reasoning")]
        public string? Reasoning { get; set; }
    }

    private sealed class OpenRouterUsage
    {
        [JsonPropertyName("total_tokens")]
        public int TotalTokens { get; set; }
    }

    private sealed class OpenRouterErrorResponse
    {
        [JsonPropertyName("error")]
        public OpenRouterError? Error { get; set; }
    }

    private sealed class OpenRouterError
    {
        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }
}
