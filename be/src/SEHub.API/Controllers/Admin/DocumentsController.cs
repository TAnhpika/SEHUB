using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Admin;
using SEHub.Contracts.Admin;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/documents")]
[Authorize(Policy = PolicyNames.RequireAdmin)]
public sealed class DocumentsController : ControllerBase
{
    private readonly IAdminDocumentService _adminDocumentService;

    public DocumentsController(IAdminDocumentService adminDocumentService)
    {
        _adminDocumentService = adminDocumentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDocuments([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _adminDocumentService.GetDocumentsAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Upload([FromForm] UploadDocumentRequest request, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required" });
        }

        if (request.CategoryId == Guid.Empty && string.IsNullOrWhiteSpace(request.SubjectCode))
        {
            return BadRequest(new { message = "SubjectCode or CategoryId is required." });
        }

        await using var stream = file.OpenReadStream();
        var result = await _adminDocumentService.UploadAsync(
            request,
            stream,
            file.FileName,
            file.ContentType,
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDocument(Guid id, CancellationToken cancellationToken)
    {
        var result = await _adminDocumentService.GetDocumentAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentRequest request, CancellationToken cancellationToken)
    {
        var result = await _adminDocumentService.UpdateAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _adminDocumentService.DeleteAsync(id, cancellationToken);
        return Ok(new { message = "Document deleted" });
    }
}
