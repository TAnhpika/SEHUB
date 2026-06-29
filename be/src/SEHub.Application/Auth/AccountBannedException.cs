using SEHub.Contracts.Users;
using SEHub.Domain.Exceptions;
using SEHub.Shared.Constants;

namespace SEHub.Application.Auth;

public sealed class AccountBannedException : ForbiddenException
{
    public AccountPenaltyDto Penalty { get; }

    public AccountBannedException(AccountPenaltyDto penalty)
        : base(ErrorCodes.AccountBanned)
    {
        Penalty = penalty;
    }
}
