using SEHub.Application.Admin;
using SEHub.Contracts.Admin;

namespace SEHub.Application.UnitTests.Admin;

public sealed class ExamContentFingerprintTests
{
    private static CreateExamQuestionItem BuildQuestion(
        int orderIndex,
        string content,
        string correctLabel,
        params (string Label, string Text)[] options)
    {
        var optionItems = options
            .Select(o => new CreateExamOptionItem
            {
                Id = Guid.NewGuid(),
                Label = o.Label,
                Text = o.Text,
            })
            .ToList();

        var correct = optionItems.First(o =>
            string.Equals(o.Label, correctLabel, StringComparison.OrdinalIgnoreCase));

        return new CreateExamQuestionItem
        {
            OrderIndex = orderIndex,
            Content = content,
            QuestionType = nameof(Domain.Enums.QuestionType.SingleChoice),
            Options = optionItems,
            CorrectOptionId = correct.Id,
            CorrectOptionIds = [correct.Id],
        };
    }

    [Fact]
    public void NormalizeText_StripsPunctuationAndCollapsesWhitespace()
    {
        var normalized = ExamContentFingerprint.NormalizeText("  Hello,   WORLD!!!  ");
        normalized.Should().Be("hello world");
    }

    [Fact]
    public void NormalizeText_AppliesNfcForCombiningCharacters()
    {
        var nfd = "e\u0301";
        var nfc = "é";
        ExamContentFingerprint.NormalizeText(nfd).Should().Be(ExamContentFingerprint.NormalizeText(nfc));
    }

    [Fact]
    public void ComputeHash_RejectsEmptyNormalizedSource()
    {
        var act = () => ExamContentFingerprint.ComputeHash(string.Empty);
        act.Should().Throw<Domain.Exceptions.DomainException>();
    }

    [Fact]
    public void ComputeHashFromQuestions_IsOrderIndependent_ByOrderIndex()
    {
        var q1 = BuildQuestion(1, "2 + 2 = ?", "A", ("A", "4"), ("B", "5"));
        var q2 = BuildQuestion(2, "3 + 3 = ?", "B", ("A", "5"), ("B", "6"));

        var forward = ExamContentFingerprint.ComputeHashFromQuestions([q1, q2]);
        var reversed = ExamContentFingerprint.ComputeHashFromQuestions([q2, q1]);

        forward.Should().Be(reversed);
    }

    [Fact]
    public void ComputeHashFromQuestions_DetectsOptionTextChange()
    {
        var original = BuildQuestion(1, "2 + 2 = ?", "A", ("A", "4"), ("B", "5"));
        var changed = BuildQuestion(1, "2 + 2 = ?", "A", ("A", "4"), ("B", "6"));

        ExamContentFingerprint.ComputeHashFromQuestions([original])
            .Should().NotBe(ExamContentFingerprint.ComputeHashFromQuestions([changed]));
    }

    [Fact]
    public void ComputeHashFromQuestions_DetectsCorrectAnswerChange()
    {
        var answerA = BuildQuestion(1, "2 + 2 = ?", "A", ("A", "4"), ("B", "5"));
        var answerB = BuildQuestion(1, "2 + 2 = ?", "B", ("A", "4"), ("B", "5"));

        ExamContentFingerprint.ComputeHashFromQuestions([answerA])
            .Should().NotBe(ExamContentFingerprint.ComputeHashFromQuestions([answerB]));
    }

    [Fact]
    public void BuildPracticeMetadata_ExcludesAssetUrl()
    {
        var source = ExamContentFingerprint.BuildPracticeMetadata("PRF192", "PE-MAE-3-001", "Desc");
        source.Should().NotContain("http");
        source.Should().Contain("prf192");
        source.Should().Contain("pe mae 3 001");
    }
}
