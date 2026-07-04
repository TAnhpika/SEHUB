using SEHub.Contracts.Admin;

namespace SEHub.Application.Abstractions.Repositories;

public interface IAdminActivityReadRepository
{
    Task<AdminActivitySnapshotDto> GetSnapshotAsync(int fetchLimit, CancellationToken cancellationToken = default);
}
