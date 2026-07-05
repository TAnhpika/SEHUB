using SEHub.Application.Gamification;

namespace SEHub.Application.UnitTests.Gamification;

public class DailyMissionPickerTests
{
    private static readonly string[] Pool =
    [
        "daily-login",
        "daily-comment",
        "daily-comment-3",
        "daily-read",
        "daily-exam-1",
        "daily-ai-1",
        "daily-post-1",
    ];

    [Fact]
    public void PickForUser_ReturnsSameSetForSameUserAndDate()
    {
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var date = new DateOnly(2026, 7, 1);

        var first = DailyMissionPicker.PickForUser(userId, date, Pool, static code => code);
        var second = DailyMissionPicker.PickForUser(userId, date, Pool, static code => code);

        Assert.Equal(first, second);
        Assert.Equal(3, first.Count);
    }

    [Fact]
    public void PickForUser_ChangesWhenDateChanges()
    {
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var reference = DailyMissionPicker.PickForUser(userId, new DateOnly(2026, 7, 1), Pool, static code => code);

        var differentDateFound = Enumerable.Range(2, 30)
            .Select(day => DailyMissionPicker.PickForUser(userId, new DateOnly(2026, 7, day), Pool, static code => code))
            .Any(pick => !pick.SequenceEqual(reference));

        Assert.True(differentDateFound, "Daily mission pick should vary for at least one date in the same month.");
    }

    [Fact]
    public void PickForUser_ReturnsAllWhenPoolSmallerThanPickCount()
    {
        var userId = Guid.NewGuid();
        var smallPool = new[] { "a", "b" };

        var picked = DailyMissionPicker.PickForUser(userId, new DateOnly(2026, 7, 1), smallPool, static code => code);

        Assert.Equal(smallPool, picked);
    }
}
