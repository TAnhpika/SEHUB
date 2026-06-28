using SEHub.Application.Abstractions;
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
        CancellationToken cancellationToken = default);
}

public sealed class ExamImageService : IExamImageService
{
    private readonly IImageCdnStorageService _cdnStorage;
    private readonly ICdnFolderSettings _cdnFolders;
    private readonly ICurrentUserService _currentUser;

    public ExamImageService(
        IImageCdnStorageService cdnStorage,
        ICdnFolderSettings cdnFolders,
        ICurrentUserService currentUser)
    {
        _cdnStorage = cdnStorage;
        _cdnFolders = cdnFolders;
        _currentUser = currentUser;
    }

    public async Task<ExamQuestionImageUploadDto> UploadQuestionImageAsync(
        Stream content,
        string fileName,
        string contentType,
        long fileSizeBytes,
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

        return new ExamQuestionImageUploadDto { Url = result.Url };
    }
}
