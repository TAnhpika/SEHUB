using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Admin;

public sealed class AdminExamService : IAdminExamService
{
    private readonly IExamRepository _examRepository;
    private readonly IExamAttachmentRepository _attachmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public AdminExamService(
        IExamRepository examRepository,
        IExamAttachmentRepository attachmentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _examRepository = examRepository;
        _attachmentRepository = attachmentRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<PagedResult<ExamListItemDto>> GetExamsAsync(ExamQueryParams query, CancellationToken cancellationToken = default)
    {
        var adminQuery = new ExamQueryParams
        {
            Type = query.Type,
            Semester = query.Semester,
            Major = query.Major,
            Page = query.Page,
            PageSize = query.PageSize,
            Status = query.Status,
            SubmittedById = query.Mine ? _currentUser.UserId : query.SubmittedById,
            IncludeUnpublished = true
        };

        var (items, total) = await _examRepository.GetPagedAsync(adminQuery, cancellationToken);
        return new PagedResult<ExamListItemDto>
        {
            Items = items.Select(MapExamListItem).ToList(),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<AdminExamDto> GetExamAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> CreateExamAsync(CreateExamRequest request, bool confirmDuplicate = false, CancellationToken cancellationToken = default)
    {
        var contentSource = request.Questions.Count > 0
            ? string.Join('|', request.Questions.Select(q => q.Content))
            : $"{request.Code}|{request.Title}|{request.Description}";
        var contentHash = OcrExamService.ComputeSha256Hash(
            OcrExamService.NormalizeText(contentSource));

        var duplicate = await _examRepository.GetByContentHashAsync(contentHash, cancellationToken);
        if (duplicate is not null && !confirmDuplicate)
        {
            throw new ConflictException(ErrorCodes.DuplicateExam);
        }

        var exam = BuildExamFromRequest(request, contentHash, _currentUser.UserId);
        await _examRepository.AddAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> UpdateExamAsync(Guid id, UpdateExamRequest request, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (request.Code is not null) exam.Code = request.Code;
        if (request.Title is not null) exam.Title = request.Title;
        if (request.Major is not null) exam.Major = request.Major;
        if (request.Description is not null) exam.Description = request.Description;
        if (request.Semester is not null && int.TryParse(request.Semester, out var semester)) exam.Semester = semester;
        if (request.ExamType is not null && Enum.TryParse<ExamType>(request.ExamType, true, out var examType)) exam.ExamType = examType;
        if (request.Status is not null && Enum.TryParse<ExamStatus>(request.Status, true, out var status)) exam.Status = status;

        if (request.Questions is not null)
        {
            exam.Questions = request.Questions.Select(q => BuildQuestion(q, exam.Id)).ToList();
            exam.QuestionCount = exam.Questions.Count;
            exam.ContentHash = OcrExamService.ComputeSha256Hash(
                OcrExamService.NormalizeText(string.Join('|', exam.Questions.Select(q => q.Content))));
        }

        exam.UpdatedAt = DateTime.UtcNow;
        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> ApproveExamAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        exam.Status = ExamStatus.Published;
        exam.UpdatedAt = DateTime.UtcNow;
        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    private static Exam BuildExamFromRequest(CreateExamRequest request, string contentHash, Guid? submittedById)
    {
        var examId = Guid.NewGuid();
        Enum.TryParse<ExamType>(request.ExamType, true, out var examType);
        int.TryParse(request.Semester, out var semester);

        var exam = new Exam
        {
            Id = examId,
            Code = request.Code,
            Title = request.Title,
            ExamType = examType,
            Semester = semester,
            Major = request.Major ?? string.Empty,
            Description = request.Description ?? string.Empty,
            AssetUrl = request.AssetUrl,
            SubmittedById = submittedById,
            Status = ExamStatus.PendingApproval,
            ContentHash = contentHash,
            QuestionCount = request.Questions.Count,
            CreatedAt = DateTime.UtcNow
        };

        exam.Questions = request.Questions.Select(q => BuildQuestion(q, examId)).ToList();
        return exam;
    }

    private static Question BuildQuestion(CreateExamQuestionItem item, Guid examId)
    {
        var questionId = Guid.NewGuid();
        return new Question
        {
            Id = questionId,
            ExamId = examId,
            OrderIndex = item.OrderIndex,
            Content = item.Content,
            CorrectOptionId = item.CorrectOptionId,
            CreatedAt = DateTime.UtcNow,
            Options = item.Options.Select(o => new QuestionOption
            {
                Id = o.Id == Guid.Empty ? Guid.NewGuid() : o.Id,
                QuestionId = questionId,
                Label = o.Label,
                Text = o.Text,
                CreatedAt = DateTime.UtcNow
            }).ToList()
        };
    }

    private async Task<AdminExamDto> MapAdminExamAsync(Exam exam, CancellationToken cancellationToken)
    {
        var attachments = await _attachmentRepository.GetByExamIdAsync(exam.Id, cancellationToken);

        return new AdminExamDto
        {
            Id = exam.Id,
            Code = exam.Code,
            Title = exam.Title,
            ExamType = exam.ExamType.ToString(),
            Semester = exam.Semester.ToString(),
            Major = exam.Major,
            QuestionCount = exam.QuestionCount,
            Status = exam.Status.ToString(),
            Description = exam.Description,
            AssetUrl = exam.AssetUrl,
            ContentHash = exam.ContentHash,
            CreatedAt = exam.CreatedAt,
            UpdatedAt = exam.UpdatedAt,
            Attachments = attachments.Select(a => ExamAttachmentService.MapDto(exam.Id, a)).ToList(),
            Questions = exam.Questions.OrderBy(q => q.OrderIndex).Select(q => new AdminExamQuestionDto
            {
                Id = q.Id,
                OrderIndex = q.OrderIndex,
                Content = q.Content,
                CorrectOptionId = q.CorrectOptionId ?? Guid.Empty,
                Options = q.Options.Select(o => new AdminExamOptionDto
                {
                    Id = o.Id,
                    Label = o.Label,
                    Text = o.Text
                }).ToList()
            }).ToList()
        };
    }

    private static ExamListItemDto MapExamListItem(Exam exam) => new()
    {
        Id = exam.Id,
        Code = exam.Code,
        Title = exam.Title,
        ExamType = exam.ExamType.ToString(),
        Semester = exam.Semester.ToString(),
        Major = exam.Major,
        QuestionCount = exam.QuestionCount,
        Status = exam.Status.ToString(),
        CreatedAt = exam.CreatedAt,
        UpdatedAt = exam.UpdatedAt
    };
}
