namespace SEHub.Contracts.Exams;

public sealed class SaveAnswersRequest
{
    public IReadOnlyDictionary<Guid, Guid> Answers { get; init; } = new Dictionary<Guid, Guid>();
}
