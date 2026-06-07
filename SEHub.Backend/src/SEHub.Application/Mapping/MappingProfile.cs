using AutoMapper;
using SEHub.Application.Models;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Documents;
using SEHub.Contracts.Feed;
using SEHub.Contracts.Exams;
using SEHub.Contracts.Premium;
using SEHub.Contracts.Admin;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;

namespace SEHub.Application.Mapping;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<UserAccount, AuthUserDto>();

        CreateMap<Post, PostListItemDto>()
            .ForMember(d => d.Excerpt, o => o.MapFrom(s => s.Content.Length > 200 ? s.Content.Substring(0, 200) + "..." : s.Content))
            .ForMember(d => d.Tags, o => o.MapFrom(s => ParseTags(s.Tags)))
            .ForMember(d => d.Author, o => o.Ignore())
            .ForMember(d => d.LikeCount, o => o.Ignore())
            .ForMember(d => d.CommentCount, o => o.Ignore());

        CreateMap<Exam, ExamListItemDto>()
            .ForMember(d => d.ExamType, o => o.MapFrom(s => s.ExamType.ToString()))
            .ForMember(d => d.Semester, o => o.MapFrom(s => s.Semester.ToString()))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));

        CreateMap<Exam, ExamDetailDto>()
            .ForMember(d => d.ExamType, o => o.MapFrom(s => s.ExamType.ToString()))
            .ForMember(d => d.Semester, o => o.MapFrom(s => s.Semester.ToString()))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));

        CreateMap<PracticeSubmission, PracticeSubmissionDto>()
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()));

        CreateMap<Document, DocumentListItemDto>()
            .ForMember(d => d.Category, o => o.MapFrom(s => s.Category != null ? s.Category.Name : string.Empty))
            .ForMember(d => d.AccessTier, o => o.MapFrom(s => s.AccessTier.ToString()));

        CreateMap<Document, DocumentDetailDto>()
            .ForMember(d => d.Category, o => o.MapFrom(s => s.Category != null ? s.Category.Name : string.Empty))
            .ForMember(d => d.AccessTier, o => o.MapFrom(s => s.AccessTier.ToString()))
            .ForMember(d => d.CanDownload, o => o.Ignore())
            .ForMember(d => d.PageLimit, o => o.Ignore());

        CreateMap<Document, AdminDocumentDto>()
            .ForMember(d => d.Category, o => o.MapFrom(s => s.Category != null ? s.Category.Name : string.Empty))
            .ForMember(d => d.AccessTier, o => o.MapFrom(s => s.AccessTier.ToString()));

        CreateMap<SubscriptionPlan, SubscriptionPlanDto>();
    }

    private static IReadOnlyList<string> ParseTags(string tags) =>
        string.IsNullOrWhiteSpace(tags) ? [] : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
