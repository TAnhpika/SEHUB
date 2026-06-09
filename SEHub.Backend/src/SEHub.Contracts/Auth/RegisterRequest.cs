namespace SEHub.Contracts.Auth;

/// <summary>
/// Register a new student account. Password must meet policy (see Swagger description).
/// </summary>
public sealed class RegisterRequest
{
    /// <summary>Valid email address (max 256 chars).</summary>
    /// <example>student@fpt.edu.vn</example>
    public string Email { get; init; } = string.Empty;

    /// <summary>Unique username: 3–50 chars, letters, numbers, underscore only.</summary>
    /// <example>student01</example>
    public string Username { get; init; } = string.Empty;

    /// <summary>Min 8 chars, uppercase, lowercase, digit, special character.</summary>
    /// <example>Student@123</example>
    public string Password { get; init; } = string.Empty;

    /// <summary>Optional display name (max 100 chars). Defaults to username if omitted.</summary>
    /// <example>Nguyen Van A</example>
    public string? DisplayName { get; init; }
}
