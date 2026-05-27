namespace svnManager.Models;

public enum DiffLineType { Context, Added, Removed, Header, FileHeader }

public class DiffLine
{
    public string Text { get; set; } = string.Empty;
    public DiffLineType LineType { get; set; }
    public int? OldLineNumber { get; set; }
    public int? NewLineNumber { get; set; }
    public string OldLineText => OldLineNumber?.ToString() ?? string.Empty;
    public string NewLineText => NewLineNumber?.ToString() ?? string.Empty;
}
