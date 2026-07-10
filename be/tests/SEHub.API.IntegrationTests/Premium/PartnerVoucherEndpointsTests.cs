using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SEHub.Application.Premium;
using SEHub.Contracts.Admin;
using SEHub.Contracts.Common;
using SEHub.Contracts.Premium;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Infrastructure.Persistence;
using SEHub.Shared.Constants;

namespace SEHub.API.IntegrationTests.Premium;

public sealed class PartnerVoucherEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PartnerVoucherEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Admin_ImportPartnerCodes_PersistsAvailableInventory()
    {
        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var response = await _client.PostAsJsonAsync(
            "/api/v1/admin/partner-vouchers/import",
            new ImportPartnerVoucherRequest
            {
                TypeCode = PartnerVoucherTypeCodes.Ftes20,
                Codes = [$"FTES-IT-{suffix}-01", $"FTES-IT-{suffix}-02", $"FTES-IT-{suffix}-01"],
            });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<ImportPartnerVoucherResultDto>>();
        body!.Success.Should().BeTrue();
        body.Data!.Imported.Should().Be(2);
        body.Data.DuplicatesSkipped.Should().Be(1);
        body.Data.RemainingAvailable.Should().BeGreaterThanOrEqualTo(2);

        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var count = await context.PartnerVoucherCodes.CountAsync(c =>
            c.Code.StartsWith($"FTES-IT-{suffix}") && c.Status == PartnerVoucherStatus.Available);
        count.Should().Be(2);
    }

    [Fact]
    public async Task PaidOrder_8m_AssignsPartnerCode_Idempotent()
    {
        var adminToken = await _factory.LoginAdminAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var suffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var codeValue = $"FTES-PAY-{suffix}";
        var importResponse = await _client.PostAsJsonAsync(
            "/api/v1/admin/partner-vouchers/import",
            new ImportPartnerVoucherRequest
            {
                TypeCode = PartnerVoucherTypeCodes.Ftes20,
                Codes = [codeValue],
            });
        importResponse.EnsureSuccessStatusCode();

        Guid orderId;
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
            var plan8m = await context.SubscriptionPlans.SingleAsync(p => p.Code == "8m");
            orderId = Guid.NewGuid();
            context.PaymentOrders.Add(new PaymentOrder
            {
                Id = orderId,
                UserId = CustomWebApplicationFactory.FreeUserId,
                PlanId = plan8m.Id,
                PayOsOrderCode = $"8m-{suffix}",
                Amount = 200000,
                Status = PaymentOrderStatus.Paid,
                PaidAt = DateTime.UtcNow,
                ExpiredAt = DateTime.UtcNow.AddMinutes(15),
                CreatedAt = DateTime.UtcNow,
            });
            await context.SaveChangesAsync();

            var partnerService = scope.ServiceProvider.GetRequiredService<IPartnerVoucherService>();
            await partnerService.TryAssignForPaidOrderAsync(orderId);
            await partnerService.TryAssignForPaidOrderAsync(orderId);
        }

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
            var assigned = await context.PartnerVoucherCodes
                .Where(c => c.PaymentOrderId == orderId)
                .ToListAsync();
            assigned.Should().HaveCount(1);
            assigned[0].Code.Should().Be(codeValue);
            assigned[0].Status.Should().Be(PartnerVoucherStatus.Assigned);
            assigned[0].AssignedUserId.Should().Be(CustomWebApplicationFactory.FreeUserId);
        }

        var userToken = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);
        var mine = await _client.GetAsync("/api/v1/me/partner-vouchers");
        mine.StatusCode.Should().Be(HttpStatusCode.OK);
        var mineBody = await mine.Content.ReadFromJsonAsync<ApiResponse<List<PartnerVoucherDto>>>();
        mineBody!.Data!.Should().Contain(v => v.Code == codeValue);
    }

    [Fact]
    public async Task PaidOrder_1m_DoesNotAssignPartnerCode()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var plan1m = await context.SubscriptionPlans.SingleAsync(p => p.Code == "1m");
        var orderId = Guid.NewGuid();
        context.PaymentOrders.Add(new PaymentOrder
        {
            Id = orderId,
            UserId = CustomWebApplicationFactory.FreeUserId,
            PlanId = plan1m.Id,
            PayOsOrderCode = $"1m-{Guid.NewGuid():N}"[..16],
            Amount = 48000,
            Status = PaymentOrderStatus.Paid,
            PaidAt = DateTime.UtcNow,
            ExpiredAt = DateTime.UtcNow.AddMinutes(15),
            CreatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        var partnerService = scope.ServiceProvider.GetRequiredService<IPartnerVoucherService>();
        await partnerService.TryAssignForPaidOrderAsync(orderId);

        var assigned = await context.PartnerVoucherCodes.CountAsync(c => c.PaymentOrderId == orderId);
        assigned.Should().Be(0);
    }

    [Fact]
    public async Task PaidOrder_WhenPoolEmpty_DoesNotFail()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SEHubDbContext>();
        var plan8m = await context.SubscriptionPlans.SingleAsync(p => p.Code == "8m");

        // Drain available ftes_20 codes for this test DB instance.
        var available = await context.PartnerVoucherCodes
            .Where(c => c.Status == PartnerVoucherStatus.Available)
            .ToListAsync();
        foreach (var code in available)
        {
            code.Status = PartnerVoucherStatus.Revoked;
        }

        await context.SaveChangesAsync();

        var orderId = Guid.NewGuid();
        context.PaymentOrders.Add(new PaymentOrder
        {
            Id = orderId,
            UserId = CustomWebApplicationFactory.FreeUserId,
            PlanId = plan8m.Id,
            PayOsOrderCode = $"empty-{Guid.NewGuid():N}"[..18],
            Amount = 200000,
            Status = PaymentOrderStatus.Paid,
            PaidAt = DateTime.UtcNow,
            ExpiredAt = DateTime.UtcNow.AddMinutes(15),
            CreatedAt = DateTime.UtcNow,
        });
        await context.SaveChangesAsync();

        var partnerService = scope.ServiceProvider.GetRequiredService<IPartnerVoucherService>();
        var act = async () => await partnerService.TryAssignForPaidOrderAsync(orderId);
        await act.Should().NotThrowAsync();

        var assigned = await context.PartnerVoucherCodes.CountAsync(c => c.PaymentOrderId == orderId);
        assigned.Should().Be(0);
    }
}
