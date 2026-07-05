using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Documents;
using SEHub.Application.Subjects;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Documents;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Admin;

public sealed class AdminDocumentService : IAdminDocumentService
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IDocumentCategoryRepository _categoryRepository;
    private readonly ISubjectLookupService _subjectLookupService;
    private readonly ICloudFileStorageService _cloudStorage;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IPdfPageExtractor _pdfPageExtractor;

    public AdminDocumentService(
        IDocumentRepository documentRepository,
        IDocumentCategoryRepository categoryRepository,
        ISubjectLookupService subjectLookupService,
        ICloudFileStorageService cloudStorage,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IPdfPageExtractor pdfPageExtractor)
    {
        _documentRepository = documentRepository;
        _categoryRepository = categoryRepository;
        _subjectLookupService = subjectLookupService;
        _cloudStorage = cloudStorage;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _pdfPageExtractor = pdfPageExtractor;
    }

    public async Task<PagedResult<AdminDocumentDto>> GetDocumentsAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var (items, total) = await _documentRepository.GetPagedAsync(new DocumentQueryParams
        {
            Page = page,
            PageSize = pageSize
        }, cancellationToken);

        return new PagedResult<AdminDocumentDto>
        {
            Items = _mapper.Map<IReadOnlyList<AdminDocumentDto>>(items),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<AdminDocumentDto> GetDocumentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        return _mapper.Map<AdminDocumentDto>(document);
    }

    public async Task<AdminDocumentDto> UploadAsync(
        UploadDocumentRequest request,
        Stream fileContent,
        string fileName,
        string mimeType,
        long fileSizeBytes,
        CancellationToken cancellationToken = default)
    {
        var category = await ResolveCategoryAsync(request, cancellationToken);

        await using var bufferedContent = new MemoryStream();
        await fileContent.CopyToAsync(bufferedContent, cancellationToken);
        bufferedContent.Position = 0;

        var detectedPageCount = _pdfPageExtractor.GetPageCount(bufferedContent);
        bufferedContent.Position = 0;

        var upload = await DocumentFileAccess.UploadPdfAsync(
            _cloudStorage,
            bufferedContent,
            fileName,
            mimeType,
            fileSizeBytes,
            cancellationToken);

        Enum.TryParse<AccessTier>(request.AccessTier, true, out var accessTier);

        var pageCount = detectedPageCount > 0
            ? detectedPageCount
            : request.PageCount > 0
                ? request.PageCount
                : 1;
        var title = string.IsNullOrWhiteSpace(request.Title) ? fileName : request.Title.Trim();

        var document = new Document
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Title = title,
            FilePath = string.Empty,
            DriveFileId = upload.DriveFileId,
            OriginalFileName = upload.OriginalFileName,
            MimeType = mimeType,
            PageCount = pageCount,
            AccessTier = accessTier,
            CreatedAt = DateTime.UtcNow
        };

        await _documentRepository.AddAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        document.Category = category;
        return _mapper.Map<AdminDocumentDto>(document);
    }

    public async Task<AdminDocumentDto> UpdateAsync(
        Guid id,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        if (document.IsDeleted)
        {
            throw new NotFoundException("Document", id);
        }

        if (request.CategoryId is Guid categoryId)
        {
            _ = await _categoryRepository.GetByIdAsync(categoryId, cancellationToken)
                ?? throw new NotFoundException("DocumentCategory", categoryId);
            document.CategoryId = categoryId;
        }

        if (!string.IsNullOrWhiteSpace(request.Title))
        {
            document.Title = request.Title.Trim();
        }

        if (request.PageCount is int pageCount)
        {
            document.PageCount = pageCount;
        }

        if (!string.IsNullOrWhiteSpace(request.AccessTier))
        {
            if (!Enum.TryParse<AccessTier>(request.AccessTier, true, out var accessTier))
            {
                throw new ForbiddenException("AccessTier must be FreePreview or PremiumFull.");
            }

            document.AccessTier = accessTier;
        }

        document.UpdatedAt = DateTime.UtcNow;
        await _documentRepository.UpdateAsync(document, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        return _mapper.Map<AdminDocumentDto>(updated);
    }

    private async Task<DocumentCategory> ResolveCategoryAsync(
        UploadDocumentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CategoryId != Guid.Empty)
        {
            var existingById = await _categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken);
            if (existingById is not null)
            {
                return existingById;
            }
        }

        var subjectCode = request.SubjectCode.Trim();
        if (string.IsNullOrWhiteSpace(subjectCode))
        {
            throw new NotFoundException("DocumentCategory", request.CategoryId);
        }

        var subject = await _subjectLookupService.GetByCodeAsync(subjectCode, cancellationToken)
            ?? throw new NotFoundException($"Subject '{subjectCode}' was not found.");

        var existingBySubject = await _categoryRepository.FindBySubjectCodeAsync(subject.Code, cancellationToken);
        if (existingBySubject is not null)
        {
            return existingBySubject;
        }

        var category = new DocumentCategory
        {
            Id = Guid.NewGuid(),
            Name = $"{subject.Code} — {subject.Name}",
            Semester = subject.Semester,
            Major = subject.Major,
            SubjectCode = subject.Code,
            CreatedAt = DateTime.UtcNow
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        return category;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var document = await _documentRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("Document", id);

        await DocumentFileAccess.DeleteStoredFileAsync(document, _cloudStorage, cancellationToken);

        var actorId = _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");
        await _documentRepository.SoftDeleteAsync(document, actorId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
