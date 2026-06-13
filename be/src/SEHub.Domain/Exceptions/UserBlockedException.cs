namespace SEHub.Domain.Exceptions;

public class UserBlockedException : ForbiddenException
{
    public const string Code = "USER_BLOCKED";

    public UserBlockedException()
        : base(Code)
    {
    }
}
