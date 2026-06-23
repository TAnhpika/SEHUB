using Microsoft.EntityFrameworkCore;
using SEHub.Application.Abstractions.Repositories;
using SEHub.Domain.Entities;

namespace SEHub.Infrastructure.Persistence.Repositories;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly SEHubDbContext _context;

    public UserProfileRepository(SEHubDbContext context) => _context = context;

    public Task<UserProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

    public Task<UserProfile?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default) =>
        (from profile in _context.UserProfiles
         join user in _context.Users on profile.UserId equals user.Id
         where user.UserName == username
         select profile).FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(UserProfile profile, CancellationToken cancellationToken = default) =>
        await _context.UserProfiles.AddAsync(profile, cancellationToken);

    public Task UpdateAsync(UserProfile profile, CancellationToken cancellationToken = default)
    {
        _context.UserProfiles.Update(profile);
        return Task.CompletedTask;
    }
}
