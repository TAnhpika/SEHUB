namespace SEHub.Domain.Exceptions;

public sealed class AiProviderException : DomainException
{
    public AiProviderException(string message)
        : base(message)
    {
    }
}
