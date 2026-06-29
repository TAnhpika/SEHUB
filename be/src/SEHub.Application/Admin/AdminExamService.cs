using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Application.Exams;
using SEHub.Application.Notifications;
using SEHub.Domain.Enums;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Entities;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;
using SEHub.Shared.Subjects;

namespace SEHub.Application.Admin;

public sealed class AdminExamService : IAdminExamService
{
    private readonly IExamRepository _examRepository;
    private readonly IExamAttachmentRepository _attachmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IWorkflowNotificationService _workflowNotifications;
    private readonly IMapper _mapper;

    public AdminExamService(
        IExamRepository examRepository,
        IExamAttachmentRepository attachmentRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IWorkflowNotificationService workflowNotifications,
        IMapper mapper)
    {
        _examRepository = examRepository;
        _attachmentRepository = attachmentRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _workflowNotifications = workflowNotifications;
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
        var code = request.Code.Trim();
        if (await _examRepository.GetByCodeAsync(code, cancellationToken) is not null)
        {
            throw new ConflictException("Mã đề đã tồn tại. Vui lòng dùng mã khác.");
        }

        var contentHash = OcrExamService.ComputeSha256Hash(
            OcrExamService.NormalizeText(BuildContentHashSource(request)));

        var duplicate = await _examRepository.GetByContentHashAsync(contentHash, cancellationToken);
        if (duplicate is not null && !confirmDuplicate)
        {
            throw new ConflictException(ErrorCodes.DuplicateExam);
        }

        var exam = BuildExamFromRequest(request, contentHash, _currentUser.UserId);
        await _examRepository.AddAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await NotifyAdminsIfModeratorSubmittedAsync(exam, cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> UpdateExamAsync(Guid id, UpdateExamRequest request, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (exam.Status == ExamStatus.Published && request.Questions is not null)
        {
            throw new DomainException("Đề đã xuất bản — không thể sửa câu hỏi trực tiếp. Tạo bản revision để gửi Admin duyệt.");
        }

        if (request.Code is not null) exam.Code = request.Code;
        if (request.Title is not null) exam.Title = request.Title;
        if (request.Major is not null)
        {
            exam.Major = ExamMajorResolver.Normalize(request.Major, exam.Code, exam.Title);
        }
        if (request.Description is not null) exam.Description = request.Description;
        if (request.Semester is not null && int.TryParse(request.Semester, out var semester)) exam.Semester = semester;
        if (request.ExamType is not null && Enum.TryParse<ExamType>(request.ExamType, true, out var examType)) exam.ExamType = examType;
        if (request.Status is not null && Enum.TryParse<ExamStatus>(request.Status, true, out var status)) exam.Status = status;

        if (request.Questions is not null)
        {
            await ReplaceExamQuestionsAsync(exam, request.Questions, cancellationToken);
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

        if (exam.Status != ExamStatus.PendingApproval)
        {
            throw new DomainException("Chỉ duyệt được đề đang chờ phê duyệt.");
        }

        if (exam.RevisionOfExamId is Guid parentId)
        {
            var parent = await _examRepository.GetByIdAsync(parentId, cancellationToken: cancellationToken)
                ?? throw new NotFoundException("Exam", parentId);

            if (parent.Status != ExamStatus.Published)
            {
                throw new DomainException("Bản gốc không còn ở trạng thái xuất bản.");
            }

            var liveCode = parent.Code;
            parent.Code = $"{liveCode}-ARCH-{DateTime.UtcNow:yyyyMMddHHmmss}";
            parent.Status = ExamStatus.Archived;
            parent.UpdatedAt = DateTime.UtcNow;

            exam.Code = liveCode;
            await _examRepository.UpdateAsync(parent, cancellationToken);
        }

        exam.Status = ExamStatus.Published;
        exam.Major = ExamMajorResolver.Normalize(exam.Major, exam.Code, exam.Title);
        exam.UpdatedAt = DateTime.UtcNow;
        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _workflowNotifications.NotifyModeratorExamReviewResultAsync(
            exam,
            approved: true,
            _currentUser.UserId,
            cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> RejectExamAsync(
        Guid id,
        RejectExamRequest request,
        CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (exam.Status != ExamStatus.PendingApproval)
        {
            throw new DomainException("Chỉ từ chối được đề đang chờ phê duyệt.");
        }

        exam.Status = ExamStatus.Rejected;
        exam.RejectionReasonCode = request.ReasonCode.Trim();
        exam.RejectionReasonDetail = string.IsNullOrWhiteSpace(request.Detail)
            ? request.ReasonLabel.Trim()
            : $"{request.ReasonLabel.Trim()}: {request.Detail.Trim()}";
        exam.RejectedAt = DateTime.UtcNow;
        exam.RejectedById = _currentUser.UserId;
        exam.UpdatedAt = DateTime.UtcNow;

        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _workflowNotifications.NotifyModeratorExamReviewResultAsync(
            exam,
            approved: false,
            _currentUser.UserId,
            cancellationToken);

        return await MapAdminExamAsync(exam, cancellationToken);
    }

    public async Task<AdminExamDto> ResubmitExamAsync(
        Guid id,
        ResubmitExamRequest request,
        CancellationToken cancellationToken = default)
    {
        RequireModeratorUserId();
        var exam = await _examRepository.GetByIdAsync(id, includeQuestions: false, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        EnsureModeratorOwnsExamInstance(exam);

        if (exam.Status != ExamStatus.Rejected
            && !(exam.Status == ExamStatus.PendingApproval && exam.RevisionOfExamId is not null))
        {
            throw new DomainException("Chỉ sửa được đề bị từ chối hoặc bản revision đang chờ duyệt.");
        }

        ApplyResubmitContent(exam, request);

        if (request.Questions.Count > 0)
        {
            await ReplaceExamQuestionsAsync(exam, request.Questions, cancellationToken);
        }

        if (exam.Status == ExamStatus.Rejected)
        {
            exam.RejectionReasonCode = null;
            exam.RejectionReasonDetail = null;
            exam.RejectedAt = null;
            exam.RejectedById = null;
        }

        exam.Status = ExamStatus.PendingApproval;
        exam.UpdatedAt = DateTime.UtcNow;

        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var refreshed = await _examRepository.GetByIdAsync(id, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        await NotifyAdminsIfModeratorSubmittedAsync(refreshed, cancellationToken);
        return await MapAdminExamAsync(refreshed, cancellationToken);
    }

    public async Task<AdminExamDto> CreateRevisionAsync(Guid publishedExamId, CancellationToken cancellationToken = default)
    {
        RequireModeratorUserId();
        var published = await _examRepository.GetByIdAsync(publishedExamId, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", publishedExamId);

        EnsureModeratorOwnsExamInstance(published);

        if (published.Status != ExamStatus.Published)
        {
            throw new DomainException("Chỉ tạo bản sửa từ đề đã xuất bản.");
        }

        var existingRevision = await _examRepository.GetPendingRevisionOfAsync(publishedExamId, cancellationToken);
        if (existingRevision is not null)
        {
            return await MapAdminExamAsync(existingRevision, cancellationToken);
        }

        var revision = await CloneExamAsRevisionAsync(published, cancellationToken);
        await _examRepository.AddAsync(revision, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await NotifyAdminsIfModeratorSubmittedAsync(revision, cancellationToken);

        return await MapAdminExamAsync(revision, cancellationToken);
    }

    public async Task DeleteExamAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (exam.Status == ExamStatus.Archived)
        {
            throw new DomainException("Đề đã được xóa trước đó.");
        }

        if (await _examRepository.GetPendingRevisionOfAsync(id, cancellationToken) is not null)
        {
            throw new DomainException("Không thể xóa đề đang có bản revision chờ duyệt. Hãy xử lý hàng chờ trước.");
        }

        var liveCode = exam.Code;
        exam.Code = $"{liveCode}-DEL-{DateTime.UtcNow:yyyyMMddHHmmss}";
        exam.Status = ExamStatus.Archived;
        exam.UpdatedAt = DateTime.UtcNow;

        await _examRepository.UpdateAsync(exam, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task NotifyAdminsIfModeratorSubmittedAsync(Exam exam, CancellationToken cancellationToken)
    {
        if (exam.Status != ExamStatus.PendingApproval)
        {
            return;
        }

        if (string.Equals(_currentUser.Role, RoleNames.Admin, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        await _workflowNotifications.NotifyAdminsExamPendingReviewAsync(
            exam,
            _currentUser.UserId,
            cancellationToken);
    }

    private static string BuildContentHashSource(CreateExamRequest request)
    {
        if (request.Questions.Count > 0)
        {
            return string.Join('|', request.Questions.Select(q => q.Content));
        }

        return $"{request.Code}|{request.Title}|{request.Description}|{request.AssetUrl}";
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
            Major = ExamMajorResolver.Normalize(request.Major, request.Code, request.Title),
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
        var options = item.Options.Select(o => new QuestionOption
        {
            Id = o.Id == Guid.Empty ? Guid.NewGuid() : o.Id,
            QuestionId = questionId,
            Label = o.Label,
            Text = o.Text,
            CreatedAt = DateTime.UtcNow,
        }).ToList();

        var questionType = Enum.TryParse<QuestionType>(item.QuestionType, true, out var parsedType)
            ? parsedType
            : QuestionType.SingleChoice;
        var correctOptionIds = ResolveCorrectOptionIds(item, options);
        if (correctOptionIds.Count == 0 && options.Count > 0)
        {
            correctOptionIds = [options[0].Id];
        }

        if (correctOptionIds.Count > 1)
        {
            questionType = QuestionType.MultiSelect;
        }

        int? requiredSelectCount = questionType == QuestionType.MultiSelect
            ? item.RequiredSelectCount ?? correctOptionIds.Count
            : null;

        return new Question
        {
            Id = questionId,
            ExamId = examId,
            OrderIndex = item.OrderIndex,
            Content = item.Content,
            QuestionType = questionType,
            RequiredSelectCount = requiredSelectCount,
            CorrectOptionId = questionType == QuestionType.SingleChoice ? correctOptionIds[0] : null,
            CorrectOptionIdsJson = QuestionCorrectAnswers.SerializeCorrectOptionIds(correctOptionIds),
            CreatedAt = DateTime.UtcNow,
            Options = options,
        };
    }

    private static List<Guid> ResolveCorrectOptionIds(CreateExamQuestionItem item, IReadOnlyList<QuestionOption> options)
    {
        var optionIds = options.Select(option => option.Id).ToHashSet();
        var fromRequest = item.CorrectOptionIds.Where(optionIds.Contains).Distinct().ToList();
        if (fromRequest.Count > 0)
        {
            return fromRequest;
        }

        if (item.CorrectOptionId != Guid.Empty && optionIds.Contains(item.CorrectOptionId))
        {
            return [item.CorrectOptionId];
        }

        return [];
    }

    private static Exam CloneExamAsRevision(Exam published, string revisionCode)
    {
        var revisionId = Guid.NewGuid();

        var revision = new Exam
        {
            Id = revisionId,
            Code = revisionCode,
            Title = published.Title,
            ExamType = published.ExamType,
            Semester = published.Semester,
            Major = published.Major,
            Description = published.Description,
            AssetUrl = published.AssetUrl,
            SubmittedById = published.SubmittedById,
            RevisionOfExamId = published.Id,
            Status = ExamStatus.PendingApproval,
            ContentHash = published.ContentHash,
            QuestionCount = published.QuestionCount,
            CreatedAt = DateTime.UtcNow,
        };

        revision.Questions = published.Questions
            .OrderBy(q => q.OrderIndex)
            .Select(q =>
            {
                var questionId = Guid.NewGuid();
                var options = q.Options.Select(o => new QuestionOption
                {
                    Id = Guid.NewGuid(),
                    QuestionId = questionId,
                    Label = o.Label,
                    Text = o.Text,
                    CreatedAt = DateTime.UtcNow,
                }).ToList();

                var correctLabels = QuestionCorrectAnswers.GetCorrectOptionIds(q)
                    .Select(id => q.Options.FirstOrDefault(o => o.Id == id)?.Label)
                    .Where(label => !string.IsNullOrWhiteSpace(label))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var remappedCorrectIds = options
                    .Where(o => correctLabels.Contains(o.Label))
                    .Select(o => o.Id)
                    .ToList();

                if (remappedCorrectIds.Count == 0)
                {
                    remappedCorrectIds = options.Count > 0 ? [options[0].Id] : [];
                }

                return new Question
                {
                    Id = questionId,
                    ExamId = revisionId,
                    OrderIndex = q.OrderIndex,
                    Content = q.Content,
                    QuestionType = q.QuestionType,
                    RequiredSelectCount = q.RequiredSelectCount,
                    CorrectOptionId = q.QuestionType == QuestionType.SingleChoice
                        ? remappedCorrectIds.FirstOrDefault()
                        : null,
                    CorrectOptionIdsJson = QuestionCorrectAnswers.SerializeCorrectOptionIds(remappedCorrectIds),
                    CreatedAt = DateTime.UtcNow,
                    Options = options,
                };
            })
            .ToList();

        return revision;
    }

    private async Task<Exam> CloneExamAsRevisionAsync(Exam published, CancellationToken cancellationToken)
    {
        var revisionCode = await BuildRevisionCodeAsync(published.Code, cancellationToken);
        return CloneExamAsRevision(published, revisionCode);
    }

    private async Task<string> BuildRevisionCodeAsync(string publishedCode, CancellationToken cancellationToken)
    {
        var baseCode = $"{publishedCode.Trim()}-Rev";
        if (baseCode.Length > 50)
        {
            baseCode = baseCode[..50];
        }

        var candidate = baseCode;
        var suffix = 2;
        while (await _examRepository.GetByCodeAsync(candidate, cancellationToken) is not null)
        {
            candidate = $"{baseCode}-{suffix}";
            if (candidate.Length > 50)
            {
                candidate = candidate[..50];
            }

            suffix++;
        }

        return candidate;
    }

    private async Task ReplaceExamQuestionsAsync(
        Exam exam,
        IEnumerable<CreateExamQuestionItem> items,
        CancellationToken cancellationToken)
    {
        var newQuestions = items.Select(q => BuildQuestion(q, exam.Id)).ToList();
        await _examRepository.ReplaceQuestionsAsync(exam.Id, newQuestions, cancellationToken);
        exam.QuestionCount = newQuestions.Count;
        exam.ContentHash = OcrExamService.ComputeSha256Hash(
            OcrExamService.NormalizeText(string.Join('|', newQuestions.Select(q => q.Content))));
    }

    private static void ApplyResubmitContent(Exam exam, ResubmitExamRequest request)
    {
        if (exam.RevisionOfExamId is null)
        {
            exam.Title = request.Title.Trim();
        }

        if (request.Description is not null)
        {
            exam.Description = request.Description;
        }

        if (request.AssetUrl is not null)
        {
            exam.AssetUrl = request.AssetUrl;
        }
        else if (exam.ExamType == ExamType.Practice && request.Questions.Count == 0)
        {
            exam.ContentHash = OcrExamService.ComputeSha256Hash(
                OcrExamService.NormalizeText($"{exam.Code}|{exam.Title}|{exam.Description}|{exam.AssetUrl}"));
        }
    }

    private Guid RequireModeratorUserId() =>
        _currentUser.UserId ?? throw new ForbiddenException("Authentication required.");

    private void EnsureModeratorOwnsExamInstance(Exam exam)
    {
        var userId = RequireModeratorUserId();
        if (exam.SubmittedById != userId && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("You can only edit your own exam submissions.");
        }
    }

    private static bool CanModeratorResubmit(Exam exam) =>
        exam.Status == ExamStatus.Rejected
        || (exam.Status == ExamStatus.PendingApproval && exam.RevisionOfExamId is not null);

    private static bool IsContentLocked(Exam exam) =>
        exam.Status == ExamStatus.Published;

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
            RevisionOfExamId = exam.RevisionOfExamId,
            RejectionReasonCode = exam.RejectionReasonCode,
            RejectionReasonDetail = exam.RejectionReasonDetail,
            RejectedAt = exam.RejectedAt,
            CanResubmit = CanModeratorResubmit(exam),
            IsContentLocked = IsContentLocked(exam),
            RevisionSourceCode = exam.RevisionOfExam?.Code,
            RevisionSourceTitle = exam.RevisionOfExam?.Title,
            Attachments = attachments.Select(a => ExamAttachmentService.MapDto(exam.Id, a)).ToList(),
            Questions = exam.Questions.OrderBy(q => q.OrderIndex).Select(q => new AdminExamQuestionDto
            {
                Id = q.Id,
                OrderIndex = q.OrderIndex,
                Content = q.Content,
                QuestionType = q.QuestionType.ToString(),
                RequiredSelectCount = q.RequiredSelectCount,
                CorrectOptionId = q.CorrectOptionId ?? Guid.Empty,
                CorrectOptionIds = QuestionCorrectAnswers.GetCorrectOptionIds(q),
                Options = q.Options.OrderBy(o => o.Label).Select(o => new AdminExamOptionDto
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
        Description = exam.Description,
        AssetUrl = exam.AssetUrl,
        ContentHash = exam.ContentHash,
        CreatedAt = exam.CreatedAt,
        UpdatedAt = exam.UpdatedAt,
        RevisionOfExamId = exam.RevisionOfExamId,
        RejectionReasonCode = exam.RejectionReasonCode,
        RejectionReasonDetail = exam.RejectionReasonDetail,
        RejectedAt = exam.RejectedAt,
        CanResubmit = CanModeratorResubmit(exam),
        IsContentLocked = IsContentLocked(exam),
        RevisionSourceCode = exam.RevisionOfExam?.Code,
        RevisionSourceTitle = exam.RevisionOfExam?.Title,
    };
}
