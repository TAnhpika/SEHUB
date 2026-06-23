using Microsoft.AspNetCore.Http;
using SEHub.Application.Abstractions;

namespace SEHub.Infrastructure.Identity;

public sealed class ClientContext : IClientContext
{
    public ClientContext(IHttpContextAccessor httpContextAccessor)
    {
        IpAddress = httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
    }

    public string? IpAddress { get; }
}
