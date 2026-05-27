namespace svnManager.Models;

public class SvnLogEntry
{
    public long Revision { get; set; }
    public string Author { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<SvnChangedPath> ChangedPaths { get; set; } = new();
}

public class SvnChangedPath
{
    public string Path { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
}
