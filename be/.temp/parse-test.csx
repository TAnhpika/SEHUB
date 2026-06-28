using SEHub.Application.Admin;
var svc = new ExamMarkdownImportService();
var md = """
## Câu 2
Chọn đáp án thích hợp trong A. B. C. D để điền vào ngoặc cho câu sau:
あしたも 7時に学校へ(
).
O A

A. きます
B. ききます
C. はたらきます
D. おきます

**Đáp án: A**
""";
try {
  var r = svc.Parse(md);
  Console.WriteLine($"Count={r.QuestionCount} Warnings={r.Warnings.Count}");
  foreach (var w in r.Warnings) Console.WriteLine(w);
} catch (Exception ex) { Console.WriteLine("ERR: " + ex.Message); }

var md2 = md.Replace("**Đáp án: A**", "Đáp án: A.");
try {
  var r2 = svc.Parse(md2);
  Console.WriteLine($"Count2={r2.QuestionCount} Warnings2={r2.Warnings.Count}");
  foreach (var w in r2.Warnings) Console.WriteLine(w);
} catch (Exception ex) { Console.WriteLine("ERR2: " + ex.Message); }
