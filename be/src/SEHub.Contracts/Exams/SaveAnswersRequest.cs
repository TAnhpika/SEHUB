namespace SEHub.Contracts.Exams;

public sealed class SaveAnswersRequest
{
    public IReadOnlyDictionary<Guid, IReadOnlyList<Guid>> Answers { get; init; } =
        new Dictionary<Guid, IReadOnlyList<Guid>>();
}
