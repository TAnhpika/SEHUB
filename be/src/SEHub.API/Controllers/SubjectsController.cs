using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Subjects;
using SEHub.Domain.Exceptions;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/subjects")]
public sealed class SubjectsController : ControllerBase
{
    private readonly ISubjectCatalogService _subjectCatalogService;
    private readonly ISubjectLookupService _subjectLookupService;

    public SubjectsController(
        ISubjectCatalogService subjectCatalogService,
        ISubjectLookupService subjectLookupService)
    {
        _subjectCatalogService = subjectCatalogService;
        _subjectLookupService = subjectLookupService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetSubjects(CancellationToken cancellationToken)
    {
        var result = await _subjectCatalogService.GetCatalogAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSubjectByCode(string code, CancellationToken cancellationToken)
    {
        var result = await _subjectLookupService.GetByCodeAsync(code, cancellationToken);
        if (result is null)
        {
            throw new NotFoundException($"Subject '{code}' was not found.");
        }

        return Ok(result);
    }
}
