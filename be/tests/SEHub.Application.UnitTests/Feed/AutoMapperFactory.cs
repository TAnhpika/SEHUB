using AutoMapper;
using SEHub.Application.Mapping;

namespace SEHub.Application.UnitTests.Feed;

internal static class AutoMapperFactory
{
    public static IMapper Create() =>
        new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
            cfg.AddProfile<FeedMappingProfile>();
        }).CreateMapper();
}
