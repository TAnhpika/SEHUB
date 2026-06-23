namespace SEHub.Domain.Exceptions;

public class NotFoundException : DomainException
{
    public NotFoundException(string message)
        : base(message)
    {
    }

    public NotFoundException(string entityName, Guid id)
        : base($"{entityName} with id '{id}' was not found.")
    {
    }
}
