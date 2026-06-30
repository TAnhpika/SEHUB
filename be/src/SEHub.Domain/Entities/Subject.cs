namespace SEHub.Domain.Entities;

public class Subject
{
    public string Code { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Semester { get; set; }
}
