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
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public ExamQueryService(IExamRepository examRepository, ICurrentUserService currentUser, IMapper mapper)
    {
        _examRepository = examRepository;
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

        return _mapper.Map<ExamDetailDto>(exam);
    }

    public async Task<IReadOnlyList<QuestionPublicDto>> GetQuestionsAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        var exam = await _examRepository.GetByIdAsync(examId, includeQuestions: true, cancellationToken: cancellationToken)
            ?? throw new NotFoundException("Exam", examId);

        if (exam.Status != ExamStatus.Published && !_currentUser.IsModeratorOrAdmin)
        {
            throw new NotFoundException("Exam", examId);
        }

        return exam.Questions
            .OrderBy(q => q.OrderIndex)
            .Select(q => new QuestionPublicDto
            {
                Id = q.Id,
                OrderIndex = q.OrderIndex,
                Content = q.Content,
                Options = q.Options.Select(o => new QuestionOptionDto
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
            CorrectOptionId = question.CorrectOptionId,
            Options = question.Options.Select(o => new QuestionOptionDto
            {
                Id = o.Id,
                Label = o.Label,
                Text = o.Text
            }).ToList()
        };
    }
}
