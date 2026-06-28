using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class ViolationEscalationRepository : IViolationEscalationRepository
{
    private readonly SEHubDbContext _context;

    public ViolationEscalationRepository(SEHubDbContext context) => _context = context;

    public Task<ViolationEscalation?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.ViolationEscalations
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

    public async Task AddAsync(ViolationEscalation escalation, CancellationToken cancellationToken = default) =>
        await _context.ViolationEscalations.AddAsync(escalation, cancellationToken);

    public Task UpdateAsync(ViolationEscalation escalation, CancellationToken cancellationToken = default)
    {
        _context.ViolationEscalations.Update(escalation);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<Guid>> GetDistinctUserIdsAsync(CancellationToken cancellationToken = default) =>
        await _context.ViolationEscalations
            .Select(e => e.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);
}
