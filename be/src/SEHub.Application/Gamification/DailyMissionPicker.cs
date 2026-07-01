namespace SEHub.Application.Gamification;

public static class DailyMissionPicker
{
    public const int DailyPickCount = 3;

    public static IReadOnlyList<T> PickForUser<T>(
        Guid userId,
        DateOnly date,
        IReadOnlyList<T> missions,
        Func<T, string> codeSelector,
        int count = DailyPickCount)
    {
        if (missions.Count == 0)
        {
            return [];
        }

        if (missions.Count <= count)
        {
            return missions;
        }

        return missions
            .Select(mission => (mission, rank: Rank(userId, date, codeSelector(mission))))
            .OrderBy(item => item.rank)
            .ThenBy(item => codeSelector(item.mission), StringComparer.Ordinal)
            .Take(count)
            .Select(item => item.mission)
            .ToList();
    }

    public static bool IsAssigned(
        Guid userId,
        DateOnly date,
        IReadOnlyList<string> allCodes,
        string code,
        int count = DailyPickCount)
    {
        if (allCodes.Count <= count)
        {
            return true;
        }

        return PickForUser(userId, date, allCodes, static c => c, count).Contains(code);
    }

    private static int Rank(Guid userId, DateOnly date, string code) =>
        HashCode.Combine(userId, date.Year, date.Month, date.Day, StringComparer.Ordinal.GetHashCode(code));
}
