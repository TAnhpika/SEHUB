using System.Text;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SEHub.API.Filters;
using SEHub.API.Services;
using SEHub.Application.Abstractions;
using SEHub.Application.Auth;
using SEHub.Application.Exams;

namespace SEHub.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<AiTokenLimitSettings>(configuration.GetSection(AiTokenLimitSettings.SectionName));

        services.AddControllers(options =>
        {
            options.Filters.Add<ApiResponseWrapperFilter>();
        });

        services.AddFluentValidationAutoValidation();
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "SEHub API",
                Version = "v1",
                Description = """
                    SEHub backend REST API for the React SPA (Giai đoạn 1 MVP).

                    **Base URL (dev):** `http://localhost:5006/api/v1`

                    ## Response envelope
                    All endpoints return `ApiResponse<T>` except `GET /health` and PayOS webhook:
                    ```json
                    { "success": true, "data": { }, "message": null, "errors": [] }
                    ```
                    Validation errors → HTTP **400**, `success: false`, `message`: "Dữ liệu không hợp lệ", `errors[]` with camelCase `field` + `message`.

                    ## Auth for FE
                    1. `POST /auth/login` or `POST /auth/register` → copy `data.accessToken`
                    2. Swagger: **Authorize** → `Bearer {accessToken}`
                    3. Axios: `Authorization: Bearer ${accessToken}`

                    ## Register password policy (ASP.NET Identity)
                    - Minimum 8 characters
                    - At least one uppercase letter (A–Z)
                    - At least one lowercase letter (a–z)
                    - At least one digit (0–9)
                    - At least one special character (e.g. `@`, `!`, `#`)

                    Example: `Student@123`

                    ## Dev seed accounts
                    | Email | Password | Role |
                    | --- | --- | --- |
                    | admin@sehub.local | Admin@123 | Admin |
                    | demo.student@sehub.local | Demo@12345 | Student (after DemoDataSeeder) |

                    ## FE integration order
                    Auth → Feed (`/posts`) → Exams → Documents → Premium → Profile → Admin

                    See also: `docs/FE_API_QUICKSTART.md`, `SEHub.API.http`, `postman/SEHub-FE.postman_collection.json`
                    """
            });

            var xmlFiles = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "SEHub.API.xml"),
                Path.Combine(AppContext.BaseDirectory, "SEHub.Contracts.xml")
            };

            foreach (var xmlFile in xmlFiles)
            {
                if (File.Exists(xmlFile))
                {
                    options.IncludeXmlComments(xmlFile);
                }
            }

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT Authorization header using the Bearer scheme."
            });

            options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", document)] = []
            });
        });

        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173"];

        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCors", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
            ?? throw new InvalidOperationException("Jwt configuration section is missing.");

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.StartsWithSegments("/hubs/chat"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorizationPolicies();
        services.AddAuthRateLimiting(configuration);

        services.AddSignalR();
        services.AddScoped<IChatNotifier, ChatHubNotifier>();

        return services;
    }
}
