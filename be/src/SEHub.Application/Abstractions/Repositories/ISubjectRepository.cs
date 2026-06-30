using SEHub.Domain.Entities;

namespace SEHub.Application.Abstractions.Repositories;

public interface ISubjectRepository
{
    Task<IReadOnlyList<Subject>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Subject?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
}
