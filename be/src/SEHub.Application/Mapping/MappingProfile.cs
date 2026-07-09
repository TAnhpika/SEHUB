using AutoMapper;
using SEHub.Application.Exams;
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
            .ForMember(d => d.SubjectCode, o => o.MapFrom(s => s.SubjectCode))
            .ForMember(d => d.PaperCode, o => o.MapFrom(s => s.PaperCode))
            .ForMember(d => d.ExamType, o => o.MapFrom(s => s.ExamType.ToString()))
            .ForMember(d => d.Semester, o => o.MapFrom(s => ExamDtoMapper.ResolveSemester(s).ToString()))
            .ForMember(d => d.Major, o => o.MapFrom(s => ExamDtoMapper.ResolveMajor(s)))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.SubjectName, o => o.MapFrom(s => ExamDtoMapper.ResolveSubjectName(s)))
            .ForMember(d => d.QuestionCount, o => o.MapFrom(s => s.Questions.Count));

        CreateMap<Exam, ExamDetailDto>()
            .ForMember(d => d.SubjectCode, o => o.MapFrom(s => s.SubjectCode))
            .ForMember(d => d.PaperCode, o => o.MapFrom(s => s.PaperCode))
            .ForMember(d => d.ExamType, o => o.MapFrom(s => s.ExamType.ToString()))
            .ForMember(d => d.Semester, o => o.MapFrom(s => ExamDtoMapper.ResolveSemester(s).ToString()))
            .ForMember(d => d.Major, o => o.MapFrom(s => ExamDtoMapper.ResolveMajor(s)))
            .ForMember(d => d.Status, o => o.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.SubjectName, o => o.MapFrom(s => ExamDtoMapper.ResolveSubjectName(s)))
            .ForMember(d => d.QuestionCount, o => o.MapFrom(s => s.Questions.Count))
            .ForMember(d => d.Attachments, o => o.Ignore());

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
            .ForMember(d => d.SubjectCode, o => o.MapFrom(s => s.Category != null ? s.Category.SubjectCode : string.Empty))
            .ForMember(d => d.Semester, o => o.MapFrom(s =>
                s.Category != null && s.Category.Subject != null ? s.Category.Subject.Semester : 0))
            .ForMember(d => d.AccessTier, o => o.MapFrom(s => s.AccessTier.ToString()));

        CreateMap<SubscriptionPlan, SubscriptionPlanDto>();
    }
}
