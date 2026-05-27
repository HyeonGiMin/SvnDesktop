namespace svnManager.Models;

public enum SvnStatusKind
{
    Normal,
    Modified,
    Added,
    Deleted,
    Conflicted,
    Unversioned,
    Missing,
    Replaced
}

public class SvnFileStatus
{
    public string Path { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public SvnStatusKind Status { get; set; }
    public bool IsChecked { get; set; } = true;

    public string StatusLabel => Status switch
    {
        SvnStatusKind.Modified => "M",
        SvnStatusKind.Added => "A",
        SvnStatusKind.Deleted => "D",
        SvnStatusKind.Conflicted => "C",
        SvnStatusKind.Unversioned => "?",
        SvnStatusKind.Missing => "!",
        SvnStatusKind.Replaced => "R",
        _ => " "
    };
}
