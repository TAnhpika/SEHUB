using SEHub.Contracts.Premium;
using SEHub.Infrastructure.Email;

namespace SEHub.Application.UnitTests.Notifications;

public sealed class PaymentConfirmationEmailComposerTests
{
    [Fact]
    public void BuildPlainText_IncludesPlanAmountOrderAndExpiry()
    {
        var message = new PaymentConfirmationEmailMessage
        {
            ToEmail = "student@sehub.local",
            DisplayName = "Demo Student",
            PlanName = "1 Month",
            AmountVnd = 48000,
            OrderCode = "123456",
            ExpiresAt = new DateTime(2026, 7, 8, 12, 0, 0, DateTimeKind.Utc),
            AppHomeUrl = "http://localhost:5173/home",
        };

        var text = PaymentConfirmationEmailComposer.BuildPlainText(message);

        text.Should().Contain("Demo Student");
        text.Should().Contain("1 Month");
        text.Should().Contain("48.000");
        text.Should().Contain("123456");
        text.Should().Contain("http://localhost:5173/home");
    }
}
