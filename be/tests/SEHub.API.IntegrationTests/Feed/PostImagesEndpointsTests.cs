using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using SEHub.Contracts.Common;
using SEHub.Contracts.Feed;
using SEHub.Domain.Enums;

namespace SEHub.API.IntegrationTests.Feed;

public sealed class PostImagesEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PostImagesEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreatePost_WithInlineImg_StripsImagesFromContent()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = "Post with inline image",
            Content = "<p>Hello</p><img src=\"https://res.cloudinary.com/demo/image/upload/sample.jpg\" alt=\"x\">",
            Tags = ["images"]
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        created!.Data!.Content.Should().NotContain("<img");
        created.Data.Content.Should().NotContain("cloudinary.com");
        created.Data.Content.Should().Contain("Hello");
        created.Data.Images.Should().BeEmpty();
    }

    [Fact]
    public async Task UploadAndDeletePostImages_AuthorFlow_Succeeds()
    {
        var token = await _factory.LoginAndGetTokenAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await _client.PostAsJsonAsync("/api/v1/posts", new CreatePostRequest
        {
            Title = "Gallery post",
            Content = "<p>Text only body</p>",
            Tags = ["gallery"]
        });
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        var postId = created!.Data!.Id;

        using var form = new MultipartFormDataContent();
        var bytes = Encoding.UTF8.GetBytes("fake-image-bytes");
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form.Add(fileContent, "files", "cover.jpg");

        var uploadResponse = await _client.PostAsync($"/api/v1/posts/{postId}/images", form);
        uploadResponse.EnsureSuccessStatusCode();
        var uploaded = await uploadResponse.Content.ReadFromJsonAsync<ApiResponse<List<PostImageDto>>>();
        uploaded!.Data.Should().HaveCount(1);
        var imageId = uploaded.Data![0].Id;
        uploaded.Data[0].ImagePath.Should().NotBeNullOrWhiteSpace();

        var detailResponse = await _client.GetAsync($"/api/v1/posts/{postId}");
        detailResponse.EnsureSuccessStatusCode();
        var detail = await detailResponse.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        detail!.Data!.Images.Should().HaveCount(1);
        detail.Data.Images[0].ImagePath.Should().NotBeNullOrWhiteSpace();
        detail.Data.Content.Should().NotContain("<img");

        var deleteResponse = await _client.DeleteAsync($"/api/v1/posts/{postId}/images/{imageId}");
        deleteResponse.EnsureSuccessStatusCode();

        var afterDelete = await _client.GetAsync($"/api/v1/posts/{postId}");
        var afterBody = await afterDelete.Content.ReadFromJsonAsync<ApiResponse<PostDetailDto>>();
        afterBody!.Data!.Images.Should().BeEmpty();
    }

    [Fact]
    public async Task DeletePostImage_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.DeleteAsync(
            $"/api/v1/posts/{Guid.NewGuid()}/images/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
