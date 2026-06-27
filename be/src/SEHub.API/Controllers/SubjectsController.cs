using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Subjects;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/subjects")]
public sealed class SubjectsController : ControllerBase
{
    private readonly ISubjectCatalogService _subjectCatalogService;

    public SubjectsController(ISubjectCatalogService subjectCatalogService) =>
        _subjectCatalogService = subjectCatalogService;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetSubjects(CancellationToken cancellationToken)
    {
        var result = await _subjectCatalogService.GetCatalogAsync(cancellationToken);
        return Ok(result);
    }
}
