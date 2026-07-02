using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Exams;
using SEHub.Contracts.Exams;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/exams")]
public sealed class ExamsController : ControllerBase
{
    private readonly IExamQueryService _examQueryService;
    private readonly IExamAttemptService _examAttemptService;
    private readonly IAiExplanationApplicationService _aiExplanationService;
    private readonly IAiExamChatApplicationService _aiExamChatService;
    private readonly IExamAttachmentService _examAttachmentService;
    private readonly IQuestionReportService _questionReportService;
    private readonly IQuestionCommentService _questionCommentService;

    public ExamsController(
        IExamQueryService examQueryService,
        IExamAttemptService examAttemptService,
        IAiExplanationApplicationService aiExplanationService,
        IAiExamChatApplicationService aiExamChatService,
        IExamAttachmentService examAttachmentService,
        IQuestionReportService questionReportService,
        IQuestionCommentService questionCommentService)
    {
        _examQueryService = examQueryService;
        _examAttemptService = examAttemptService;
        _aiExplanationService = aiExplanationService;
        _aiExamChatService = aiExamChatService;
        _examAttachmentService = examAttachmentService;
        _questionReportService = questionReportService;
        _questionCommentService = questionCommentService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetExams([FromQuery] ExamQueryParams query, CancellationToken cancellationToken)
    {
        var result = await _examQueryService.GetExamsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _examQueryService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/questions")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetQuestions(Guid id, CancellationToken cancellationToken)
    {
        var result = await _examQueryService.GetQuestionsAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/questions/{questionId:guid}")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> GetQuestionWithAnswer(Guid id, Guid questionId, CancellationToken cancellationToken)
    {
        var result = await _examQueryService.GetQuestionWithAnswerAsync(id, questionId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("questions/{questionId:guid}/ai-explain")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> AiExplain(Guid questionId, [FromBody] AiExplainRequest request, CancellationToken cancellationToken)
    {
        var result = await _aiExplanationService.ExplainAsync(questionId, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{examId:guid}/questions/{questionId:guid}/ai-chat")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> GetExamAiChat(Guid examId, Guid questionId, CancellationToken cancellationToken)
    {
        var result = await _aiExamChatService.GetThreadAsync(examId, questionId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{examId:guid}/questions/{questionId:guid}/ai-chat")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> SendExamAiChat(
        Guid examId,
        Guid questionId,
        [FromBody] ExamAiChatRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _aiExamChatService.SendMessageAsync(examId, questionId, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/attempts")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> StartAttempt(Guid id, CancellationToken cancellationToken)
    {
        var result = await _examAttemptService.StartAttemptAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/attempts/current")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> GetCurrentAttempt(Guid id, CancellationToken cancellationToken)
    {
        var result = await _examAttemptService.GetCurrentAttemptAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/attempts/{attemptId:guid}")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> GetAttempt(Guid id, Guid attemptId, CancellationToken cancellationToken)
    {
        var result = await _examAttemptService.GetAttemptAsync(id, attemptId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/attempts/{attemptId:guid}/answers")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> SaveAnswers(Guid id, Guid attemptId, [FromBody] SaveAnswersRequest request, CancellationToken cancellationToken)
    {
        var result = await _examAttemptService.SaveAnswersAsync(id, attemptId, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/attempts/{attemptId:guid}/submit")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> Submit(Guid id, Guid attemptId, CancellationToken cancellationToken)
    {
        var result = await _examAttemptService.SubmitAsync(id, attemptId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/attempts/{attemptId:guid}/result")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> GetResult(Guid id, Guid attemptId, CancellationToken cancellationToken)
    {
        var result = await _examAttemptService.GetResultAsync(id, attemptId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{examId:guid}/attachments/{attachmentId:guid}/view")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> ViewAttachment(
        Guid examId,
        Guid attachmentId,
        CancellationToken cancellationToken)
    {
        var content = await _examAttachmentService.OpenViewAsync(examId, attachmentId, cancellationToken);
        return File(content.Stream, content.ContentType, content.FileName, enableRangeProcessing: true);
    }

    [HttpPost("{examId:guid}/questions/{questionId:guid}/report")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> ReportQuestion(
        Guid examId,
        Guid questionId,
        [FromBody] CreateQuestionReportRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _questionReportService.ReportAsync(examId, questionId, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{examId:guid}/questions/{questionId:guid}/comments")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> GetQuestionComments(
        Guid examId,
        Guid questionId,
        CancellationToken cancellationToken)
    {
        var result = await _questionCommentService.GetCommentsAsync(examId, questionId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{examId:guid}/questions/{questionId:guid}/comments")]
    [Authorize(Policy = PolicyNames.RequirePremium)]
    public async Task<IActionResult> CreateQuestionComment(
        Guid examId,
        Guid questionId,
        [FromBody] CreateQuestionCommentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _questionCommentService.CreateAsync(examId, questionId, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{examId:guid}/questions/{questionId:guid}/comments/{commentId:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> DeleteQuestionComment(
        Guid examId,
        Guid questionId,
        Guid commentId,
        CancellationToken cancellationToken)
    {
        await _questionCommentService.DeleteAsync(examId, questionId, commentId, cancellationToken);
        return NoContent();
    }
}
