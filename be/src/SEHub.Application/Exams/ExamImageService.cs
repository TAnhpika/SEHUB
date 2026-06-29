using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Application.Storage;
using SEHub.Contracts.Exams;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

public interface IExamImageService
{
    Task<ExamQuestionImageUploadDto> UploadQuestionImageAsync(
        Stream content,
        string fileName,
        string contentType,
        long fileSizeBytes,
        Guid? questionId = null,
        CancellationToken cancellationToken = default);
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

        CdnUploadResult result;
        try
        {
            result = await _cdnStorage.UploadImageAsync(
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

        if (questionId is Guid qid)
        {
            await _attachmentRepository.AddAsync(
                qid,
                result.PublicId,
                result.Url,
                sortOrder: 0,
                cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new ExamQuestionImageUploadDto { Url = result.Url };
    }
}
