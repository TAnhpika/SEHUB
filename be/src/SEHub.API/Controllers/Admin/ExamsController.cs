using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
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

    public ExamsController(IAdminExamService adminExamService, IOcrExamService ocrExamService)
    {
        _adminExamService = adminExamService;
        _ocrExamService = ocrExamService;
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

    [HttpPost("upload-asset")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> UploadAsset(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required" });
        }

        await using var stream = file.OpenReadStream();
        var result = await _adminExamService.UploadAssetAsync(
            stream,
            file.FileName,
            file.ContentType,
            cancellationToken);

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
    public async Task<IActionResult> UpdateExam(Guid id, [FromBody] UpdateExamRequest request, CancellationToken cancellationToken)
    {
        var result = await _adminExamService.UpdateExamAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Policy = PolicyNames.RequireAdmin)]
    public async Task<IActionResult> ApproveExam(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminExamService.ApproveExamAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("ocr")]
    [Authorize(Policy = PolicyNames.RequireAdmin)]
    public async Task<IActionResult> OcrExam([FromBody] OcrExamRequest request, CancellationToken cancellationToken)
    {
        var result = await _ocrExamService.ProcessAsync(request, cancellationToken);
        return Ok(result);
    }
}
