using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Application.Exams;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Exams;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/exams")]
public sealed class ExamsController : ControllerBase
{
    private readonly IAdminExamService _adminExamService;
    private readonly IOcrExamService _ocrExamService;
    private readonly IExamMarkdownImportService _markdownImportService;
    private readonly IExamAttachmentService _examAttachmentService;
    private readonly IExamImageService _examImageService;

    public ExamsController(
        IAdminExamService adminExamService,
        IOcrExamService ocrExamService,
        IExamMarkdownImportService markdownImportService,
        IExamAttachmentService examAttachmentService,
        IExamImageService examImageService)
    {
        _adminExamService = adminExamService;
        _ocrExamService = ocrExamService;
        _markdownImportService = markdownImportService;
        _examAttachmentService = examAttachmentService;
        _examImageService = examImageService;
    }

    [HttpGet]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> GetExams([FromQuery] ExamQueryParams query, CancellationToken cancellationToken)
    {
        var result = await _adminExamService.GetExamsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> CreateExam([FromBody] CreateExamRequest request, [FromQuery] bool confirmDuplicate = false, CancellationToken cancellationToken = default)
    {
        var result = await _adminExamService.CreateExamAsync(request, confirmDuplicate, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> GetExam(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminExamService.GetExamAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireAdmin)]
    public async Task<IActionResult> UpdateExam(
        Guid id,
        [FromBody] UpdateExamRequest request,
        [FromQuery] bool confirmDuplicate = false,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminExamService.UpdateExamAsync(id, request, confirmDuplicate, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Policy = PolicyNames.RequireAdmin)]
    public async Task<IActionResult> ApproveExam(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminExamService.ApproveExamAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Policy = PolicyNames.RequireAdmin)]
    public async Task<IActionResult> RejectExam(Guid id, [FromBody] RejectExamRequest request, CancellationToken cancellationToken)
    {
        var result = await _adminExamService.RejectExamAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/resubmit")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> ResubmitExam(
        Guid id,
        [FromBody] ResubmitExamRequest request,
        [FromQuery] bool confirmDuplicate = false,
        CancellationToken cancellationToken = default)
    {
        var result = await _adminExamService.ResubmitExamAsync(id, request, confirmDuplicate, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireAdmin)]
    public async Task<IActionResult> DeleteExam(Guid id, CancellationToken cancellationToken)
    {
        await _adminExamService.DeleteExamAsync(id, cancellationToken);
        return Ok(new { message = "Exam deleted" });
    }

    [HttpPost("{id:guid}/revision")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> CreateRevision(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminExamService.CreateRevisionAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("ocr")]
    [Authorize(Policy = PolicyNames.RequireAdmin)]
    public async Task<IActionResult> OcrExam([FromBody] OcrExamRequest request, CancellationToken cancellationToken)
    {
        var result = await _ocrExamService.ProcessAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("import-markdown")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public IActionResult ImportMarkdown([FromBody] ImportExamMarkdownRequest? request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Markdown))
        {
            throw new Domain.Exceptions.DomainException("Markdown content is required.");
        }

        var result = _markdownImportService.Parse(request.Markdown);
        return Ok(result);
    }

    /// <summary>Deprecated — use POST questions/{questionId}/images for gallery.</summary>
    [HttpPost("upload-question-image")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    [RequestSizeLimit(5_242_880)]
    public async Task<IActionResult> UploadQuestionImage(
        IFormFile file,
        [FromQuery] Guid? questionId,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required." });
        }

        await using var stream = file.OpenReadStream();
        var result = await _examImageService.UploadQuestionImageAsync(
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            questionId,
            cancellationToken);

        return Ok(result);
    }

    [HttpPost("questions/{questionId:guid}/images")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    [RequestSizeLimit(26_214_400)]
    public async Task<IActionResult> UploadQuestionImages(
        Guid questionId,
        IFormFileCollection files,
        CancellationToken cancellationToken)
    {
        if (files.Count == 0)
        {
            return BadRequest(new { message = "At least one image is required." });
        }

        var uploads = new List<QuestionImageUpload>();
        foreach (var file in files)
        {
            if (file.Length == 0)
            {
                continue;
            }

            await using var stream = file.OpenReadStream();
            var buffer = new MemoryStream();
            await stream.CopyToAsync(buffer, cancellationToken);
            buffer.Position = 0;

            uploads.Add(new QuestionImageUpload
            {
                Content = buffer,
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSizeBytes = file.Length
            });
        }

        if (uploads.Count == 0)
        {
            return BadRequest(new { message = "At least one image is required." });
        }

        var result = await _examImageService.UploadImagesAsync(questionId, uploads, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("questions/{questionId:guid}/images/{imageId:guid}")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> DeleteQuestionImage(
        Guid questionId,
        Guid imageId,
        CancellationToken cancellationToken)
    {
        await _examImageService.DeleteImageAsync(questionId, imageId, cancellationToken);
        return Ok(new { message = "Image deleted" });
    }

    [HttpPost("{id:guid}/attachments")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> UploadAttachment(Guid id, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required." });
        }

        await using var stream = file.OpenReadStream();
        var result = await _examAttachmentService.UploadPdfAsync(
            id,
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            cancellationToken);

        return Ok(result);
    }

    [HttpDelete("{examId:guid}/attachments/{attachmentId:guid}")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> DeleteAttachment(
        Guid examId,
        Guid attachmentId,
        CancellationToken cancellationToken)
    {
        await _examAttachmentService.DeleteAsync(examId, attachmentId, cancellationToken);
        return Ok(new { message = "Attachment deleted" });
    }
}
