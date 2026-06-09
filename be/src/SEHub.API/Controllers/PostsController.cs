using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEHub.Application.Feed;
using SEHub.Contracts.Feed;
using SEHub.Shared.Constants;

namespace SEHub.API.Controllers;

[ApiController]
[Route("api/v1/posts")]
public sealed class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ICommentService _commentService;
    private readonly IPostLikeService _postLikeService;
    private readonly IPostReportService _postReportService;

    public PostsController(
        IPostService postService,
        ICommentService commentService,
        IPostLikeService postLikeService,
        IPostReportService postReportService)
    {
        _postService = postService;
        _commentService = commentService;
        _postLikeService = postLikeService;
        _postReportService = postReportService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPosts([FromQuery] PostQueryParams query, CancellationToken cancellationToken)
    {
        var result = await _postService.GetPostsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("featured")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFeatured(CancellationToken cancellationToken)
    {
        var result = await _postService.GetFeaturedAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _postService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Create([FromBody] CreatePostRequest request, CancellationToken cancellationToken)
    {
        var result = await _postService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePostRequest request, CancellationToken cancellationToken)
    {
        var result = await _postService.UpdateAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/feature")]
    [Authorize(Policy = PolicyNames.RequireModerator)]
    public async Task<IActionResult> Feature(Guid id, [FromBody] FeaturePostRequest request, CancellationToken cancellationToken)
    {
        var result = await _postService.SetFeaturedAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _postService.DeleteAsync(id, cancellationToken);
        return Ok(new { message = "Post deleted" });
    }

    [HttpPost("{id:guid}/like")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Like(Guid id, CancellationToken cancellationToken)
    {
        var result = await _postLikeService.LikeAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/like")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Unlike(Guid id, CancellationToken cancellationToken)
    {
        var result = await _postLikeService.UnlikeAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/comments")]
    [AllowAnonymous]
    public async Task<IActionResult> GetComments(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _commentService.GetCommentsAsync(id, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/comments")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> CreateComment(Guid id, [FromBody] CreateCommentRequest request, CancellationToken cancellationToken)
    {
        var result = await _commentService.CreateAsync(id, request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/comments/{commentId:guid}")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId, CancellationToken cancellationToken)
    {
        await _commentService.DeleteAsync(id, commentId, cancellationToken);
        return Ok(new { message = "Comment deleted" });
    }

    [HttpPost("{id:guid}/report")]
    [Authorize(Policy = PolicyNames.RequireAuthenticated)]
    public async Task<IActionResult> Report(Guid id, [FromBody] ReportPostRequest request, CancellationToken cancellationToken)
    {
        await _postReportService.ReportAsync(id, request.Reason, cancellationToken);
        return Ok(new { message = "Report submitted" });
    }
}
