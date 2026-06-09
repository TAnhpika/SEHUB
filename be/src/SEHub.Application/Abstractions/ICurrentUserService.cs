namespace SEHub.Application.Abstractions;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
    bool IsPremium { get; }
    bool IsModeratorOrAdmin { get; }
    string? Role { get; }
}
