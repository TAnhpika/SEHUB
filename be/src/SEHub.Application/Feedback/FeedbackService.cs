using System.Text.Json;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feedback;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Feedback;

public interface IFeedbackService
{
    Task<FeedbackDto> SubmitAsync(SubmitFeedbackRequest request, CancellationToken cancellationToken = default);
    Task<FeedbackAttachmentUploadResponse> UploadAttachmentsAsync(
        IReadOnlyList<FeedbackUploadFile> files,
        CancellationToken cancellationToken = default);
    Task<PagedResult<FeedbackDto>> GetPagedAsync(
        int page,
        int pageSize,
        FeedbackStatus? status,
        CancellationToken cancellationToken = default);
    Task<FeedbackDto> UpdateStatusAsync(
        Guid id,
        UpdateFeedbackStatusRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record FeedbackUploadFile(Stream Content, string FileName, string ContentType, long Length);

public sealed class FeedbackService : IFeedbackService
{
    private static readonly string[] AllowedContentTypes =
    [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
    ];

    private const long MaxFileSizeBytes = 100L * 1024 * 1024;
    private const int MaxFilesPerUpload = 10;

    private readonly IUserFeedbackRepository _feedbackRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _fileStorage;
    private readonly IUnitOfWork _unitOfWork;

    public FeedbackService(
        IUserFeedbackRepository feedbackRepository,
        ICurrentUserService currentUser,
        IFileStorageService fileStorage,
        IUnitOfWork unitOfWork)
    {
        _feedbackRepository = feedbackRepository;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
        _unitOfWork = unitOfWork;
    }

    public async Task<FeedbackDto> SubmitAsync(
        SubmitFeedbackRequest request,
        CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        var username = request.Username?.Trim() ?? string.Empty;
        var description = request.Description?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(username))
        {
            throw new DomainException("Username is required.");
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new DomainException("Description is required.");
        }

        var attachmentUrls = request.AttachmentUrls?
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => url.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? [];

        var feedback = new UserFeedback
        {
            Id = Guid.NewGuid(),
            UserId = _currentUser.UserId,
            Username = username,
            Description = description,
            Status = FeedbackStatus.Pending,
            AttachmentUrlsJson = SerializeUrls(attachmentUrls),
            CreatedAt = DateTime.UtcNow,
        };

        await _feedbackRepository.AddAsync(feedback, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(feedback);
    }

    public async Task<FeedbackAttachmentUploadResponse> UploadAttachmentsAsync(
        IReadOnlyList<FeedbackUploadFile> files,
        CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        if (files.Count == 0)
        {
            throw new DomainException("At least one file is required.");
        }

        if (files.Count > MaxFilesPerUpload)
        {
            throw new DomainException($"You can upload at most {MaxFilesPerUpload} files.");
        }

        var urls = new List<string>();

        foreach (var file in files)
        {
            if (file.Length <= 0)
            {
                throw new DomainException("File is empty.");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                throw new DomainException("File exceeds the 100 MB limit.");
            }

            var contentType = file.ContentType?.Trim() ?? string.Empty;
            if (!AllowedContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
            {
                throw new DomainException("Unsupported file type.");
            }

            var relativePath = await _fileStorage.UploadAsync(
                file.Content,
                file.FileName,
                contentType,
                "feedback",
                cancellationToken);

            var publicUrl = await _fileStorage.GetSignedUrlAsync(relativePath, TimeSpan.FromDays(365), cancellationToken);
            urls.Add(publicUrl);
        }

        return new FeedbackAttachmentUploadResponse { Urls = urls };
    }

    public async Task<PagedResult<FeedbackDto>> GetPagedAsync(
        int page,
        int pageSize,
        FeedbackStatus? status,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _feedbackRepository.GetPagedAsync(page, pageSize, status, cancellationToken);

        return new PagedResult<FeedbackDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<FeedbackDto> UpdateStatusAsync(
        Guid id,
        UpdateFeedbackStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<FeedbackStatus>(request.Status, true, out var status))
        {
            throw new DomainException("Invalid feedback status.");
        }

        var feedback = await _feedbackRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Feedback", id);

        feedback.Status = status;
        feedback.UpdatedAt = DateTime.UtcNow;

        await _feedbackRepository.UpdateAsync(feedback, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(feedback);
    }

    private static FeedbackDto MapToDto(UserFeedback feedback) =>
        new()
        {
            Id = feedback.Id,
            UserId = feedback.UserId,
            Username = feedback.Username,
            Description = feedback.Description,
            Status = feedback.Status.ToString(),
            AttachmentUrls = DeserializeUrls(feedback.AttachmentUrlsJson),
            CreatedAt = feedback.CreatedAt,
        };

    private static string SerializeUrls(IReadOnlyList<string> urls) =>
        JsonSerializer.Serialize(urls);

    private static IReadOnlyList<string> DeserializeUrls(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
