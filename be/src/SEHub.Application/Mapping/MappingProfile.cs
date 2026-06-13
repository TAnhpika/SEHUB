using AutoMapper;
using SEHub.Application.Models;
using SEHub.Contracts.Auth;
using SEHub.Contracts.Documents;
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
            .ForMember(d => d.Semester, o => o.MapFrom(s => s.Category != null ? s.Category.Semester : 0))
            .ForMember(d => d.AccessTier, o => o.MapFrom(s => s.AccessTier.ToString()));

        CreateMap<SubscriptionPlan, SubscriptionPlanDto>();
    }
}
