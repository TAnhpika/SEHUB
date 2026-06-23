using AutoMapper;
using SEHub.Application.Abstractions;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Contracts.Common;
using SEHub.Contracts.Exams;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Exams;

public sealed class ExamQueryService : IExamQueryService
{
    private readonly IExamRepository _examRepository;
    private readonly IExamAttachmentRepository _attachmentRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public ExamQueryService(
        IExamRepository examRepository,
        IExamAttachmentRepository attachmentRepository,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _examRepository = examRepository;
        _attachmentRepository = attachmentRepository;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<PagedResult<ExamListItemDto>> GetExamsAsync(ExamQueryParams query, CancellationToken cancellationToken = default)
    {
        var (items, total) = await _examRepository.GetPagedAsync(query, cancellationToken);
        return new PagedResult<ExamListItemDto>
        {
            Items = _mapper.Map<IReadOnlyList<ExamListItemDto>>(items),
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<ExamDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(id, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", id);

        if (exam.Status != ExamStatus.Published && !_currentUser.IsModeratorOrAdmin)
        {
            throw new NotFoundException("Exam", id);
        }

        var dto = _mapper.Map<ExamDetailDto>(exam);
        IReadOnlyList<ExamAttachmentDto> attachmentDtos = [];

        if (ExamContentAccess.CanViewExamContent(_currentUser, exam))
        {
            var attachments = await _attachmentRepository.GetByExamIdAsync(id, cancellationToken);
            attachmentDtos = attachments.Select(a => ExamAttachmentService.MapDto(id, a)).ToList();
        }

        return new ExamDetailDto
        {
            Id = dto.Id,
            Code = dto.Code,
            Title = dto.Title,
            ExamType = dto.ExamType,
            Semester = dto.Semester,
            Major = dto.Major,
            QuestionCount = dto.QuestionCount,
            Status = dto.Status,
            Description = dto.Description,
            AssetUrl = dto.AssetUrl,
            Attachments = attachmentDtos
        };
    }

    public async Task<IReadOnlyList<QuestionPublicDto>> GetQuestionsAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(examId, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        ExamContentAccess.EnsureCanViewExamContent(_currentUser, exam);

        return exam.Questions
            .OrderBy(q => q.OrderIndex)
            .Select(q => new QuestionPublicDto
            {
                Id = q.Id,
                OrderIndex = q.OrderIndex,
                Content = q.Content,
                QuestionType = q.QuestionType.ToString(),
                RequiredSelectCount = q.RequiredSelectCount,
                Options = q.Options
                    .OrderBy(o => o.Label)
                    .Select(o => new QuestionOptionDto
                {
                    Id = o.Id,
                    Label = o.Label,
                    Text = o.Text
                }).ToList()
            })
            .ToList();
    }

    public async Task<QuestionAnswerDto> GetQuestionWithAnswerAsync(Guid examId, Guid questionId, CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsPremium && !_currentUser.IsModeratorOrAdmin)
        {
            throw new ForbiddenException("Premium subscription required to view answers.");
        }

        var exam = await _examRepository.GetByIdAsync(examId, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        var question = exam.Questions.FirstOrDefault(q => q.Id == questionId)
            ?? throw new NotFoundException("Question", questionId);

        return new QuestionAnswerDto
        {
            Id = question.Id,
            OrderIndex = question.OrderIndex,
            Content = question.Content,
            QuestionType = question.QuestionType.ToString(),
            RequiredSelectCount = question.RequiredSelectCount,
            CorrectOptionId = question.CorrectOptionId,
            CorrectOptionIds = QuestionCorrectAnswers.GetCorrectOptionIds(question),
            Options = question.Options
                .OrderBy(o => o.Label)
                .Select(o => new QuestionOptionDto
            {
                Id = o.Id,
                Label = o.Label,
                Text = o.Text
            }).ToList()
        };
    }
}
