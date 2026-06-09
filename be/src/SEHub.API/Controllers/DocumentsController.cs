using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Documents;
using SEHub.Contracts.Documents;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/documents")]
public sealed class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetDocuments([FromQuery] DocumentQueryParams query, CancellationToken cancellationToken)
    {
        var result = await _documentService.GetDocumentsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _documentService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/preview")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Preview(Guid id, [FromQuery] int page = 1, CancellationToken cancellationToken = default)
    {
        var result = await _documentService.GetPreviewAsync(id, page, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/download")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var url = await _documentService.GetDownloadUrlAsync(id, cancellationToken);
        return Ok(new { downloadUrl = url });
    }
}
