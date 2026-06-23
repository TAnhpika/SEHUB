using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace SEHub.API.IntegrationTests.Auth;

public sealed class StrictRateLimitWebApplicationFactory : CustomWebApplicationFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "StrictRateLimit",
                ["RateLimit:LoginPermitLimit"] = "5",
                ["RateLimit:GoogleLoginPermitLimit"] = "5",
                ["RateLimit:RegisterPermitLimit"] = "5",
                ["RateLimit:RefreshPermitLimit"] = "20"
            });
        });
    }
}
