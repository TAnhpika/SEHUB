namespace SEHub.Application.Abstractions;



public interface IPayOsWebhookHandler

{

    Task<bool> HandleAsync(string payload, string signature, CancellationToken cancellationToken = default);

}

