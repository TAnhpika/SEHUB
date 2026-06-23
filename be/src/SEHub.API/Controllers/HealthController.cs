using Microsoft.AspNetCore.Mvc;
using SEHub.API.Filters;

namespace SEHub.API.Controllers;

[ApiController]
[SkipApiEnvelope]
public sealed class HealthController : ControllerBase
{
    [HttpGet("/health")]
    public IActionResult Get() => Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
}
