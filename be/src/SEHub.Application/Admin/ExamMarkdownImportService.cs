using System.Text.RegularExpressions;
using SEHub.Contracts.Admin;

namespace SEHub.Application.Admin;

public interface IExamMarkdownImportService
{
    ImportExamMarkdownResponse Parse(string markdown);
}

public sealed class ExamMarkdownImportService : IExamMarkdownImportService
{
    private static readonly Regex QuestionHeaderRegex = new(
        @"^#{1,3}\s*(?:C(?:âu|au)\s*)?(\d+)\s*$",
        RegexOptions.IgnoreCase | RegexOptions.Multiline | RegexOptions.Compiled);

    private static readonly Regex OptionLineRegex = new(
        @"^([A-Da-d])[\.)]\s*(.+)$",
        RegexOptions.Compiled);

    private static readonly Regex AnswerRegex = new(
        @"(?:\*\*)?(?:Đáp án|Dap an|Answer)\s*:\s*([A-Da-d])(?:\*\*)?",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public ImportExamMarkdownResponse Parse(string markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
        {
            throw new Domain.Exceptions.DomainException("Markdown content is required.");
        }

        var warnings = new List<string>();
        var blocks = SplitQuestionBlocks(markdown.Trim());
        if (blocks.Count == 0)
        {
            throw new Domain.Exceptions.DomainException(
                "Không tìm thấy câu hỏi. Dùng tiêu đề ## Câu 1 hoặc phân tách bằng ---.");
        }

        var questions = new List<CreateExamQuestionItem>();
        for (var index = 0; index < blocks.Count; index++)
        {
            var block = blocks[index];
            try
            {
                questions.Add(ParseQuestionBlock(block, index + 1, warnings));
            }
            catch (Exception ex)
            {
                warnings.Add($"Câu {index + 1}: {ex.Message}");
            }
        }

        if (questions.Count == 0)
        {
            throw new Domain.Exceptions.DomainException("Không parse được câu hỏi hợp lệ từ markdown.");
        }

        return new ImportExamMarkdownResponse
        {
            Questions = questions,
            QuestionCount = questions.Count,
            Warnings = warnings,
        };
    }

    private static List<string> SplitQuestionBlocks(string markdown)
    {
        var normalized = markdown.Replace("\r\n", "\n");
        var headerMatches = QuestionHeaderRegex.Matches(normalized).Cast<Match>().ToList();

        if (headerMatches.Count > 0)
        {
            var blocks = new List<string>();
            for (var i = 0; i < headerMatches.Count; i++)
            {
                var start = headerMatches[i].Index;
                var end = i + 1 < headerMatches.Count ? headerMatches[i + 1].Index : normalized.Length;
                blocks.Add(normalized[start..end].Trim());
            }

            return blocks.Where(b => b.Length > 0).ToList();
        }

        return normalized
            .Split("\n---\n", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(b => b.Length > 0)
            .ToList();
    }

    private static CreateExamQuestionItem ParseQuestionBlock(string block, int fallbackOrder, List<string> warnings)
    {
        var lines = block
            .Replace("\r\n", "\n")
            .Split('\n')
            .Select(l => l.Trim())
            .Where(l => l.Length > 0)
            .ToList();

        if (lines.Count == 0)
        {
            throw new InvalidOperationException("Khối câu hỏi trống.");
        }

        var startIndex = QuestionHeaderRegex.IsMatch(lines[0]) ? 1 : 0;
        var optionStartIndex = lines.FindIndex(startIndex, l => OptionLineRegex.IsMatch(l));
        if (optionStartIndex < 0)
        {
            throw new InvalidOperationException("Thiếu đáp án dạng A. ... B. ...");
        }

        var contentLines = lines.Skip(startIndex).Take(optionStartIndex - startIndex).ToList();
        var content = string.Join("\n", contentLines).Trim();
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("Thiếu nội dung câu hỏi.");
        }

        var options = new List<CreateExamOptionItem>();
        var optionLines = new List<(string Label, string Text)>();
        for (var i = optionStartIndex; i < lines.Count; i++)
        {
            var match = OptionLineRegex.Match(lines[i]);
            if (!match.Success)
            {
                continue;
            }

            optionLines.Add((match.Groups[1].Value.ToUpperInvariant(), match.Groups[2].Value.Trim()));
        }

        if (optionLines.Count < 2)
        {
            throw new InvalidOperationException("Cần ít nhất 2 phương án A/B.");
        }

        foreach (var (label, text) in optionLines)
        {
            options.Add(new CreateExamOptionItem
            {
                Id = Guid.NewGuid(),
                Label = label,
                Text = text,
            });
        }

        var answerMatch = AnswerRegex.Match(block);
        if (!answerMatch.Success)
        {
            throw new InvalidOperationException("Thiếu dòng **Đáp án: X** hoặc Answer: X.");
        }

        var answerLabel = answerMatch.Groups[1].Value.ToUpperInvariant();
        var correctOption = options.FirstOrDefault(o => o.Label == answerLabel);
        if (correctOption is null)
        {
            throw new InvalidOperationException($"Đáp án {answerLabel} không khớp phương án.");
        }

        var orderIndex = fallbackOrder;
        var headerMatch = QuestionHeaderRegex.Match(lines[0]);
        if (headerMatch.Success && int.TryParse(headerMatch.Groups[1].Value, out var parsedOrder))
        {
            orderIndex = parsedOrder;
        }

        if (options.Count < 4)
        {
            warnings.Add($"Câu {orderIndex}: chỉ có {options.Count} phương án.");
        }

        return new CreateExamQuestionItem
        {
            OrderIndex = orderIndex,
            Content = content,
            Options = options,
            CorrectOptionId = correctOption.Id,
        };
    }
}
