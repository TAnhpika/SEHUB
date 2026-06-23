using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Models;
using SEHub.Application.Storage;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Feed;

public interface IPostImageService
{
    Task<PostContentImageUploadDto> UploadContentImageAsync(
        Stream content,
        string fileName,
        string contentType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PostImageDto>> UploadImagesAsync(
        Guid postId,
        IReadOnlyList<PostImageUpload> uploads,
        CancellationToken cancellationToken = default);

    Task<PostImageContentResult> OpenImageAsync(Guid imageId, CancellationToken cancellationToken = default);

    Task DeleteImagesForPostAsync(Guid postId, CancellationToken cancellationToken = default);
}

public sealed class PostImageUpload
{
    public Stream Content { get; init; } = Stream.Null;
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }
}

public sealed class PostImageContentResult
{
    public Stream Stream { get; init; } = Stream.Null;
    public string ContentType { get; init; } = "application/octet-stream";
    public string FileName { get; init; } = "image";
    public string? ExternalUrl { get; init; }
}

public sealed class PostImageService : IPostImageService
{
    private readonly IPostRepository _postRepository;
    private readonly IPostImageRepository _imageRepository;
    private readonly IImageCdnStorageService _cdnStorage;
    private readonly ICdnFolderSettings _cdnFolders;
    private readonly ICloudFileStorageService _driveStorage;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public PostImageService(
        IPostRepository postRepository,
        IPostImageRepository imageRepository,
        IImageCdnStorageService cdnStorage,
        ICdnFolderSettings cdnFolders,
        ICloudFileStorageService driveStorage,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _postRepository = postRepository;
        _imageRepository = imageRepository;
        _cdnStorage = cdnStorage;
        _cdnFolders = cdnFolders;
        _driveStorage = driveStorage;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<PostContentImageUploadDto> UploadContentImageAsync(
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
                _cdnFolders.Posts,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
        {
            throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
        }

        return new PostContentImageUploadDto { Url = result.Url };
    }

    public async Task<IReadOnlyList<PostImageDto>> UploadImagesAsync(
        Guid postId,
        IReadOnlyList<PostImageUpload> uploads,
        CancellationToken cancellationToken = default)
    {
        if (uploads.Count == 0)
        {
            throw new DomainException("At least one image is required.");
        }

        var post = await _postRepository.GetByIdAsync(postId, cancellationToken)
            ?? throw new NotFoundException("Post", postId);

        EnsureAuthorOrModerator(post.AuthorId);

        var existing = await _imageRepository.GetByPostIdAsync(postId, cancellationToken);
        var sortOrder = existing.Count;
        var entities = new List<PostImage>();

        foreach (var upload in uploads)
        {
            CloudFileValidation.EnsureValidImage(upload.ContentType, upload.FileSizeBytes, upload.FileName);

            CdnUploadResult result;
            try
            {
                result = await _cdnStorage.UploadImageAsync(
                    upload.Content,
                    upload.FileName,
                    upload.ContentType,
                    _cdnFolders.Posts,
                    cancellationToken);
            }
            catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
            {
                throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
            }

            entities.Add(new PostImage
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                PublicId = result.PublicId,
                Url = result.Url,
                SortOrder = sortOrder++,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _imageRepository.AddRangeAsync(entities, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return entities.Select(MapDto).ToList();
    }

    public async Task<PostImageContentResult> OpenImageAsync(Guid imageId, CancellationToken cancellationToken = default)
    {
        var image = await _imageRepository.GetByIdAsync(imageId, cancellationToken)
            ?? throw new NotFoundException("PostImage", imageId);

        var post = await _postRepository.GetByIdAsync(image.PostId, cancellationToken)
            ?? throw new NotFoundException("Post", image.PostId);

        EnsureCanViewImage(post);

        if (!string.IsNullOrWhiteSpace(image.Url))
        {
            return new PostImageContentResult { ExternalUrl = image.Url };
        }

        if (string.IsNullOrWhiteSpace(image.DriveFileId))
        {
            throw new NotFoundException("PostImage", imageId);
        }

        CloudFileReadResult read;
        try
        {
            read = await _driveStorage.OpenReadAsync(image.DriveFileId, cancellationToken);
        }
        catch (Exception ex) when (ex is not DomainException and not NotFoundException and not ForbiddenException)
        {
            throw new DomainException(ErrorCodes.StorageUploadFailed, ex);
        }

        return new PostImageContentResult
        {
            Stream = read.Stream,
            ContentType = read.ContentType,
            FileName = read.FileName
        };
    }

    public async Task DeleteImagesForPostAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        var images = await _imageRepository.GetByPostIdAsync(postId, cancellationToken);
        if (images.Count == 0)
        {
            return;
        }

        foreach (var image in images)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(image.PublicId))
                {
                    await _cdnStorage.DeleteAsync(image.PublicId, isRaw: false, cancellationToken);
                }
                else if (!string.IsNullOrWhiteSpace(image.DriveFileId))
                {
                    await _driveStorage.DeleteAsync(image.DriveFileId, cancellationToken);
                }
            }
            catch
            {
                // Best effort cleanup when deleting post.
            }
        }

        await _imageRepository.DeleteRangeAsync(images, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    internal static PostImageDto MapDto(PostImage image) =>
        new()
        {
            Id = image.Id,
            SortOrder = image.SortOrder,
            ImagePath = !string.IsNullOrWhiteSpace(image.Url)
                ? image.Url
                : $"/api/v1/posts/images/{image.Id}"
        };

    internal async Task<IReadOnlyList<PostImageDto>> MapDtosForPostAsync(
        Guid postId,
        IPostImageRepository imageRepository,
        CancellationToken cancellationToken)
    {
        var images = await imageRepository.GetByPostIdAsync(postId, cancellationToken);
        return images.Select(MapDto).ToList();
    }

    private void EnsureCanViewImage(Post post)
    {
        if (post.Status == PostStatus.Published)
        {
            return;
        }

        if (_currentUser.IsModeratorOrAdmin)
        {
            return;
        }

        if (_currentUser.UserId == post.AuthorId)
        {
            return;
        }

        throw new NotFoundException("Post", post.Id);
    }

    private void EnsureAuthorOrModerator(Guid authorId)
    {
        if (_currentUser.IsModeratorOrAdmin)
        {
            return;
        }

        if (_currentUser.UserId != authorId)
        {
            throw new ForbiddenException("You do not have permission to modify this post.");
        }
    }
}
