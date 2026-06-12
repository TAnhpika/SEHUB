using Microsoft.AspNetCore.RateLimiting;
using SEHub.API.Extensions;
using SEHub.API.Hubs;
using SEHub.API.Middleware;
using SEHub.Application;
using SEHub.Infrastructure;
using SEHub.Infrastructure.Email;
using SEHub.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettings.Development.Local.json", optional: true, reloadOnChange: true);
}

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

if (!app.Environment.IsEnvironment("Testing"))
{
    EmailSmtpStartupValidator.ValidateAndWarn(app.Services);
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("DefaultCors");
app.UseAuthentication();
app.UseMiddleware<BannedUserMiddleware>();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

if (!app.Environment.IsEnvironment("Testing"))
{
    await DbSeeder.SeedAsync(app.Services);
}

if (app.Environment.IsDevelopment())
{
    await DemoDataSeeder.SeedAsync(app.Services);
}

app.Run();

public partial class Program;
