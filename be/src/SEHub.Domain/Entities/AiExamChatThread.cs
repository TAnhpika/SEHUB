using SEHub.Domain.Common;

namespace SEHub.Domain.Entities;

public class AiExamChatThread : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ExamId { get; set; }
    public Guid QuestionId { get; set; }

    public ICollection<AiExamChatMessage> Messages { get; set; } = [];
}
