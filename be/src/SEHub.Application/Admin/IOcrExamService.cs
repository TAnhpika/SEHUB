using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IOcrExamService
{
    Task<OcrExamResponse> ProcessAsync(OcrExamRequest request, CancellationToken cancellationToken = default);
}
