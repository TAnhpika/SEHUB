using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Application.Storage;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

public sealed class QuestionImageUpload
{
    public Stream Content { get; init; } = Stream.Null;
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
}

public interface IExamImageService
{
    /// <summary>Deprecated — prefer UploadImagesAsync for gallery. Returns CDN URL only when questionId is null.</summary>
    Task<ExamQuestionImageUploadDto> UploadQuestionImageAsync(
        Stream content,
        string fileName,
        string contentType,
        long fileSizeBytes,
        Guid? questionId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<QuestionImageDto>> UploadImagesAsync(
        Guid questionId,
        IReadOnlyList<QuestionImageUpload> uploads,
        CancellationToken cancellationToken = default);

    Task DeleteImageAsync(Guid questionId, Guid imageId, CancellationToken cancellationToken = default);

    Task DeleteImagesForQuestionAsync(Guid questionId, CancellationToken cancellationToken = default);
}

public sealed class ExamImageService : IExamImageService
{
    private readonly IImageCdnStorageService _cdnStorage;
    private readonly ICdnFolderSettings _cdnFolders;
    private readonly ICurrentUserService _currentUser;
    private readonly IQuestionAttachmentRepository _attachmentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ExamImageService(
        IImageCdnStorageService cdnStorage,
        ICdnFolderSettings cdnFolders,
        ICurrentUserService currentUser,
        IQuestionAttachmentRepository attachmentRepository,
        IUnitOfWork unitOfWork)
    {
        _cdnStorage = cdnStorage;
        _cdnFolders = cdnFolders;
        _currentUser = currentUser;
        _attachmentRepository = attachmentRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ExamQuestionImageUploadDto> UploadQuestionImageAsync(
        Stream content,
        string fileName,
        string contentType,
        long fileSizeBytes,
        Guid? questionId = null,
        CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        CloudFileValidation.EnsureValidImage(contentType, fileSizeBytes, fileName);

        var result = await UploadToCdnAsync(content, fileName, contentType, cancellationToken);

        if (questionId is Guid qid)
        {
            if (!await _attachmentRepository.QuestionExistsAsync(qid, cancellationToken))
            {
                throw new NotFoundException("Question", qid);
            }

            var existing = await _attachmentRepository.GetByQuestionIdAsync(qid, cancellationToken);
            await _attachmentRepository.AddAsync(
                qid,
                result.PublicId,
                result.Url,
                sortOrder: existing.Count,
                cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new ExamQuestionImageUploadDto { Url = result.Url };
    }

    public async Task<IReadOnlyList<QuestionImageDto>> UploadImagesAsync(
        Guid questionId,
        IReadOnlyList<QuestionImageUpload> uploads,
        CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        if (uploads.Count == 0)
        {
            throw new DomainException("At least one image is required.");
        }

        if (!await _attachmentRepository.QuestionExistsAsync(questionId, cancellationToken))
        {
            throw new NotFoundException("Question", questionId);
        }

        var existing = await _attachmentRepository.GetByQuestionIdAsync(questionId, cancellationToken);
        var sortOrder = existing.Count;
        var entities = new List<QuestionAttachment>();

        foreach (var upload in uploads)
        {
            CloudFileValidation.EnsureValidImage(upload.ContentType, upload.FileSizeBytes, upload.FileName);
            var result = await UploadToCdnAsync(
                upload.Content,
                upload.FileName,
                upload.ContentType,
                cancellationToken);

            entities.Add(new QuestionAttachment
            {
                Id = Guid.NewGuid(),
                QuestionId = questionId,
                PublicId = result.PublicId,
                Url = result.Url,
                SortOrder = sortOrder++,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _attachmentRepository.AddRangeAsync(entities, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return entities.Select(MapDto).ToList();
    }

    public async Task DeleteImageAsync(Guid questionId, Guid imageId, CancellationToken cancellationToken = default)
    {
        _ = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

        if (!await _attachmentRepository.QuestionExistsAsync(questionId, cancellationToken))
        {
            throw new NotFoundException("Question", questionId);
        }

        var image = await _attachmentRepository.GetByIdAsync(imageId, cancellationToken)
            ?? throw new NotFoundException("QuestionAttachment", imageId);

        if (image.QuestionId != questionId)
        {
            throw new NotFoundException("QuestionAttachment", imageId);
        }

        await CdnAssetCleanup.TryDeleteAsync(
            _cdnStorage,
            image.PublicId,
            image.Url,
            isRaw: false,
            cancellationToken);

        await _attachmentRepository.DeleteRangeAsync([image], cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteImagesForQuestionAsync(Guid questionId, CancellationToken cancellationToken = default)
    {
        var images = await _attachmentRepository.GetByQuestionIdAsync(questionId, cancellationToken);
        if (images.Count == 0)
        {
            return;
        }

        foreach (var image in images)
        {
            await CdnAssetCleanup.TryDeleteAsync(
                _cdnStorage,
                image.PublicId,
                image.Url,
                isRaw: false,
                cancellationToken);
        }

        await _attachmentRepository.DeleteRangeAsync(images, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    internal static QuestionImageDto MapDto(QuestionAttachment image) =>
        new()
        {
            Id = image.Id,
            SortOrder = image.SortOrder,
            ImagePath = image.Url
        };

    private async Task<CdnUploadResult> UploadToCdnAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _cdnStorage.UploadImageAsync(
                content,
                fileName,
                contentType,
                _cdnFolders.Exam,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
        {
            throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
        }
    }
}
