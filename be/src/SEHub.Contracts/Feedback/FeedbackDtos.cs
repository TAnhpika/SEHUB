namespace SEHub.Contracts.Feedback;

public sealed class SubmitFeedbackRequest
{
    public string Username { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public IReadOnlyList<string>? AttachmentUrls { get; init; }
}

public sealed class FeedbackDto
{
    public Guid Id { get; init; }
    public Guid? UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public IReadOnlyList<string> AttachmentUrls { get; init; } = [];
    public DateTime CreatedAt { get; init; }
}

public sealed class UpdateFeedbackStatusRequest
{
    public string Status { get; init; } = string.Empty;
}

public sealed class FeedbackAttachmentUploadResponse
{
    public IReadOnlyList<string> Urls { get; init; } = [];
}
