using Moq;
using SEHub.Application.Abstractions;
using SEHub.Application.Storage;

namespace SEHub.Application.UnitTests.Storage;

public sealed class CdnAssetCleanupTests
{
    [Fact]
    public async Task TryDeleteAsync_UsesPublicIdWhenPresent()
    {
        var cdn = new Mock<IImageCdnStorageService>();

        await CdnAssetCleanup.TryDeleteAsync(
            cdn.Object,
            "sehub/avatars/old",
            "https://res.cloudinary.com/demo/image/upload/v1/sehub/avatars/old.png");

        cdn.Verify(s => s.DeleteAsync("sehub/avatars/old", false, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TryDeleteAsync_ParsesPublicIdFromUrlWhenMissing()
    {
        var cdn = new Mock<IImageCdnStorageService>();

        await CdnAssetCleanup.TryDeleteAsync(
            cdn.Object,
            publicId: null,
            "https://res.cloudinary.com/demo/image/upload/v1/sehub/chat/msg.png");

        cdn.Verify(s => s.DeleteAsync("sehub/chat/msg", false, It.IsAny<CancellationToken>()), Times.Once);
    }
}
