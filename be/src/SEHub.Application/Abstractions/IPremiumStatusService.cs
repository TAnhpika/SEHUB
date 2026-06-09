namespace SEHub.Application.Abstractions;



public interface IPremiumStatusService

{

    Task<bool> IsPremiumAsync(Guid userId, CancellationToken cancellationToken = default);

    void InvalidateCache(Guid userId);

}

