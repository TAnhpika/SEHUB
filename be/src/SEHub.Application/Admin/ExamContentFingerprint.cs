using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using SEHub.Application.Exams;
using SEHub.Contracts.Admin;
using SEHub.Domain.Entities;
using SEHub.Domain.Enums;
using SEHub.Domain.Exceptions;

namespace SEHub.Application.Admin;

public static class ExamContentFingerprint
{
    private static readonly Regex CollapseWhitespaceRegex = new(@"\s+", RegexOptions.Compiled);
    private static readonly Regex StripPunctuationRegex = new(@"[^\p{L}\p{N}\s]", RegexOptions.Compiled);

    public static string NormalizeText(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var text = input.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormC);
        text = CollapseWhitespaceRegex.Replace(text, " ");
        text = StripPunctuationRegex.Replace(text, " ");
        text = CollapseWhitespaceRegex.Replace(text, " ").Trim();
        return text;
    }

    public static string ComputeHash(string normalizedSource)
    {
        if (string.IsNullOrWhiteSpace(normalizedSource))
        {
            throw new DomainException("Không đủ nội dung để tạo fingerprint đề.");
        }

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedSource));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static string ComputeHashFromCreateRequest(CreateExamRequest request)
    {
        var source = request.Questions.Count > 0
            ? BuildFromQuestions(request.Questions)
            : BuildPracticeMetadata(request.Code, request.Title, request.Description);

        return ComputeHash(NormalizeText(source));
    }

    public static string ComputeHashFromQuestions(IEnumerable<CreateExamQuestionItem> questions) =>
        ComputeHash(NormalizeText(BuildFromQuestions(questions)));

    public static string ComputeHashFromExam(Exam exam)
    {
        if (exam.Questions.Count > 0)
        {
            var items = exam.Questions
                .OrderBy(q => q.OrderIndex)
                .Select(MapQuestionToCreateItem)
                .ToList();

            return ComputeHashFromQuestions(items);
        }

        return ComputeHash(NormalizeText(BuildPracticeMetadata(exam.Code, exam.Title, exam.Description)));
    }

    public static string BuildFromQuestions(IEnumerable<CreateExamQuestionItem> questions)
    {
        var segments = questions
            .OrderBy(q => q.OrderIndex)
            .ThenBy(q => q.Content, StringComparer.Ordinal)
            .Select(BuildQuestionSegment);

        return string.Join("||", segments);
    }

    public static string BuildPracticeMetadata(string code, string title, string? description)
    {
        var normalizedCode = NormalizeText(code);
        var normalizedTitle = NormalizeText(title);
        var normalizedDescription = NormalizeText(description ?? string.Empty);
        return $"{normalizedCode}|{normalizedTitle}|{normalizedDescription}";
    }

    private static string BuildQuestionSegment(CreateExamQuestionItem item)
    {
        var content = NormalizeText(item.Content);
        var questionType = NormalizeText(item.QuestionType);
        var options = item.Options
            .OrderBy(o => o.Label, StringComparer.OrdinalIgnoreCase)
            .Select(o => $"{NormalizeText(o.Label)}:{NormalizeText(o.Text)}");

        var correctLabels = ResolveCorrectLabels(item, item.Options);
        var required = item.RequiredSelectCount?.ToString(CultureInfo.InvariantCulture) ?? string.Empty;

        return $"{content}|{questionType}|{string.Join(",", options)}|correct:{correctLabels}|req:{required}";
    }

    private static string ResolveCorrectLabels(
        CreateExamQuestionItem item,
        IReadOnlyList<CreateExamOptionItem> options)
    {
        var optionsById = options.ToDictionary(o => o.Id);
        var labels = new List<string>();

        foreach (var optionId in item.CorrectOptionIds)
        {
            if (optionsById.TryGetValue(optionId, out var option))
            {
                labels.Add(NormalizeText(option.Label));
            }
        }

        if (labels.Count == 0
            && item.CorrectOptionId != Guid.Empty
            && optionsById.TryGetValue(item.CorrectOptionId, out var single))
        {
            labels.Add(NormalizeText(single.Label));
        }

        return string.Join(",", labels.OrderBy(l => l, StringComparer.Ordinal));
    }

    private static CreateExamQuestionItem MapQuestionToCreateItem(Question question)
    {
        var options = question.Options
            .OrderBy(o => o.Label, StringComparer.OrdinalIgnoreCase)
            .Select(o => new CreateExamOptionItem
            {
                Id = o.Id,
                Label = o.Label,
                Text = o.Text,
            })
            .ToList();

        var correctOptionIds = QuestionCorrectAnswers.GetCorrectOptionIds(question);

        return new CreateExamQuestionItem
        {
            OrderIndex = question.OrderIndex,
            Content = question.Content,
            QuestionType = question.QuestionType.ToString(),
            RequiredSelectCount = question.RequiredSelectCount,
            Options = options,
            CorrectOptionId = question.CorrectOptionId ?? Guid.Empty,
            CorrectOptionIds = correctOptionIds,
        };
    }
}
