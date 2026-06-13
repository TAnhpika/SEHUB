using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Application.Storage;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Exams;

public interface IExamAttachmentService
{
    Task<ExamAttachmentDto> UploadPdfAsync(
        Guid examId,
        Stream fileContent,
        string fileName,
        string contentType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid examId, Guid attachmentId, CancellationToken cancellationToken = default);

    Task<ExamAttachmentContentResult> OpenViewAsync(
        Guid examId,
        Guid attachmentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ExamAttachmentDto>> GetMetadataForExamAsync(
        Guid examId,
        CancellationToken cancellationToken = default);
}

public sealed class ExamAttachmentContentResult
{
    public Stream Stream { get; init; } = Stream.Null;
    public string ContentType { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
}

public sealed class ExamAttachmentService : IExamAttachmentService
{
    private readonly IExamRepository _examRepository;
    private readonly IExamAttachmentRepository _attachmentRepository;
    private readonly ICloudFileStorageService _cloudStorage;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public ExamAttachmentService(
        IExamRepository examRepository,
        IExamAttachmentRepository attachmentRepository,
        ICloudFileStorageService cloudStorage,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _examRepository = examRepository;
        _attachmentRepository = attachmentRepository;
        _cloudStorage = cloudStorage;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<ExamAttachmentDto> UploadPdfAsync(
        Guid examId,
        Stream fileContent,
        string fileName,
        string contentType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default)
    {
        EnsureModeratorOrAdmin();
        CloudFileValidation.EnsureValidPdf(contentType, fileSizeBytes, fileName);

        var exam = await _examRepository.GetByIdAsync(examId, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        CloudFileUploadResult upload;
        try
        {
            upload = await _cloudStorage.UploadAsync(fileContent, fileName, contentType, cancellationToken);
        }
        catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
        {
            throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
        }

        var attachment = new ExamAttachment
        {
            Id = Guid.NewGuid(),
            ExamId = exam.Id,
            DriveFileId = upload.DriveFileId,
            OriginalFileName = upload.OriginalFileName,
            ContentType = upload.ContentType,
            FileSize = upload.FileSize,
            CreatedAt = DateTime.UtcNow
        };

        await _attachmentRepository.AddAsync(attachment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapDto(exam.Id, attachment);
    }

    public async Task DeleteAsync(Guid examId, Guid attachmentId, CancellationToken cancellationToken = default)
    {
        EnsureModeratorOrAdmin();

        var attachment = await _attachmentRepository.GetByIdAsync(attachmentId, cancellationToken)
            ?? throw new NotFoundException("ExamAttachment", attachmentId);

        if (attachment.ExamId != examId)
        {
            throw new NotFoundException("ExamAttachment", attachmentId);
        }

        try
        {
            await _cloudStorage.DeleteAsync(attachment.DriveFileId, cancellationToken);
        }
        catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
        {
            throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
        }

        await _attachmentRepository.DeleteAsync(attachment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ExamAttachmentContentResult> OpenViewAsync(
        Guid examId,
        Guid attachmentId,
        CancellationToken cancellationToken = default)
    {
        var attachment = await _attachmentRepository.GetByIdAsync(attachmentId, cancellationToken)
            ?? throw new NotFoundException("ExamAttachment", attachmentId);

        if (attachment.ExamId != examId)
        {
            throw new NotFoundException("ExamAttachment", attachmentId);
        }

        var exam = await _examRepository.GetByIdAsync(examId, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        ExamContentAccess.EnsureCanViewExamContent(_currentUser, exam);

        Stream stream;
        try
        {
            var read = await _cloudStorage.OpenReadAsync(attachment.DriveFileId, cancellationToken);
            stream = read.Stream;
            return new ExamAttachmentContentResult
            {
                Stream = stream,
                ContentType = attachment.ContentType,
                FileName = attachment.OriginalFileName
            };
        }
        catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
        {
            throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
        }
    }

    public async Task<IReadOnlyList<ExamAttachmentDto>> GetMetadataForExamAsync(
        Guid examId,
        CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(examId, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        ExamContentAccess.EnsureCanViewExamContent(_currentUser, exam);

        var attachments = await _attachmentRepository.GetByExamIdAsync(examId, cancellationToken);
        return attachments.Select(a => MapDto(examId, a)).ToList();
    }

    private void EnsureModeratorOrAdmin()
    {
        if (!_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException(ErrorCodes.Forbidden);
        }
    }

    internal static ExamAttachmentDto MapDto(Guid examId, ExamAttachment attachment) =>
        new()
        {
            Id = attachment.Id,
            OriginalFileName = attachment.OriginalFileName,
            ContentType = attachment.ContentType,
            FileSize = attachment.FileSize,
            ViewPath = $"/api/v1/exams/{examId}/attachments/{attachment.Id}/view"
        };
}
