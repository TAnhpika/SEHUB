using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.FileProviders;
using SEHub.API.Extensions;
using SEHub.API.Hubs;
using SEHub.API.Middleware;
using SEHub.Application;
using SEHub.Infrastructure;
using SEHub.Infrastructure.Email;
using SEHub.Infrastructure.Persistence;
using SEHub.Infrastructure.Storage;

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
    GoogleDriveStartupValidator.ValidateAndWarn(app.Services);
    CloudinaryStartupValidator.ValidateAndWarn(app.Services);
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("DefaultCors");
app.UseResponseCaching();
app.UseStaticFiles();
app.UseAuthentication();
app.UseMiddleware<BannedUserMiddleware>();
app.UseMiddleware<EmailConfirmedMiddleware>();
app.UseAuthorization();
app.UseRateLimiter();

var uploadsRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads",
});

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

if (!app.Environment.IsEnvironment("Testing"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<SEHubDbContext>>();
    await ExamSchemaMigration.EnsureSubjectForeignKeyAsync(context, logger);
    await ExamContentHashBackfill.RunAsync(context, logger);
}

app.Run();

public partial class Program;
