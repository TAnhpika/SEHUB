using AutoMapper;
using SEHub.Contracts.Feed;
using SEHub.Domain.Entities;

namespace SEHub.Application.Mapping;

public sealed class FeedMappingProfile : Profile
{
    public FeedMappingProfile()
    {
        CreateMap<Post, PostListItemDto>()
            .ForMember(d => d.Excerpt, o => o.MapFrom(s => s.Content.Length > 200 ? s.Content.Substring(0, 200) + "..." : s.Content))
            .ForMember(d => d.Tags, o => o.Ignore())
            .ForMember(d => d.Author, o => o.Ignore())
            .ForMember(d => d.LikeCount, o => o.Ignore())
            .ForMember(d => d.CommentCount, o => o.Ignore());
    }
}
