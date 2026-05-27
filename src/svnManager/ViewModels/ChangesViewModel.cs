using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using svnManager.Models;
using svnManager.Services;
using System.Collections.ObjectModel;

namespace svnManager.ViewModels;

public partial class ChangesViewModel : ObservableObject
{
    private readonly SvnService _svnService;
    private string _workingCopyPath = string.Empty;

    [ObservableProperty]
    private ObservableCollection<SvnFileStatus> _changedFiles = new();

    [ObservableProperty]
    private ObservableCollection<SvnFileStatus> _filteredChangedFiles = new();

    [ObservableProperty]
    private SvnFileStatus? _selectedFile;

    [ObservableProperty]
    private string _commitMessage = string.Empty;

    [ObservableProperty]
    private ObservableCollection<DiffLine> _diffLines = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    [ObservableProperty]
    private string _filterText = string.Empty;

    public bool HasNoChanges => !IsLoading && ChangedFiles.Count == 0 && !string.IsNullOrEmpty(_workingCopyPath);
    public bool IsNotLoading => !IsLoading;

    public ChangesViewModel(SvnService svnService)
    {
        _svnService = svnService;
    }

    partial void OnFilterTextChanged(string value) => RefreshFilter();

    public void RefreshFilter()
    {
        var q = FilterText?.Trim().ToLowerInvariant() ?? string.Empty;
        FilteredChangedFiles.Clear();
        foreach (var f in ChangedFiles)
        {
            if (string.IsNullOrEmpty(q)
                || f.RelativePath.ToLowerInvariant().Contains(q)
                || f.Path.ToLowerInvariant().Contains(q))
                FilteredChangedFiles.Add(f);
        }
    }

    public async void LoadAsync(string workingCopyPath)
    {
        _workingCopyPath = workingCopyPath;
        await RefreshAsync();
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        if (string.IsNullOrEmpty(_workingCopyPath)) return;
        IsLoading = true;
        StatusMessage = string.Empty;
        try
        {
            var files = await _svnService.GetStatusAsync(_workingCopyPath);
            ChangedFiles.Clear();
            foreach (var f in files)
                ChangedFiles.Add(f);
            RefreshFilter();
        }
        catch (Exception ex)
        {
            StatusMessage = $"오류: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
            OnPropertyChanged(nameof(HasNoChanges));
            OnPropertyChanged(nameof(IsNotLoading));
        }
    }

    partial void OnSelectedFileChanged(SvnFileStatus? value)
    {
        if (value is null) { DiffLines.Clear(); return; }
        LoadDiffAsync(value);
    }

    private async void LoadDiffAsync(SvnFileStatus file)
    {
        DiffLines.Clear();
        try
        {
            var raw = await _svnService.GetDiffAsync(file.Path);
            foreach (var line in ParseDiff(raw))
                DiffLines.Add(line);
        }
        catch (Exception ex)
        {
            DiffLines.Add(new DiffLine { Text = $"diff 로드 실패: {ex.Message}", LineType = DiffLineType.FileHeader });
        }
    }

    private static List<DiffLine> ParseDiff(string raw)
    {
        var result = new List<DiffLine>();
        int oldLine = 0, newLine = 0;
        bool inContent = false;
        foreach (var line in raw.Split('\n'))
        {
            if (line.StartsWith("diff ") || line.StartsWith("index ") || line.StartsWith("---") || line.StartsWith("+++"))
                result.Add(new DiffLine { Text = line, LineType = DiffLineType.FileHeader });
            else if (line.StartsWith("@@"))
            {
                inContent = true;
                var m = System.Text.RegularExpressions.Regex.Match(line, @"-(\d+)(?:,\d+)? \+(\d+)");
                if (m.Success) { oldLine = int.Parse(m.Groups[1].Value); newLine = int.Parse(m.Groups[2].Value); }
                result.Add(new DiffLine { Text = line, LineType = DiffLineType.Header });
            }
            else if (inContent && line.StartsWith("+"))
                result.Add(new DiffLine { Text = line, LineType = DiffLineType.Added, NewLineNumber = newLine++ });
            else if (inContent && line.StartsWith("-"))
                result.Add(new DiffLine { Text = line, LineType = DiffLineType.Removed, OldLineNumber = oldLine++ });
            else if (inContent)
                result.Add(new DiffLine { Text = line, LineType = DiffLineType.Context, OldLineNumber = oldLine++, NewLineNumber = newLine++ });
        }
        return result;
    }

    [RelayCommand]
    private async Task CommitAsync()
    {
        if (string.IsNullOrWhiteSpace(CommitMessage))
        {
            StatusMessage = "커밋 메시지를 입력하세요.";
            return;
        }
        var selected = ChangedFiles.Where(f => f.IsChecked).Select(f => f.Path).ToList();
        if (selected.Count == 0)
        {
            StatusMessage = "커밋할 파일을 선택하세요.";
            return;
        }

        IsLoading = true;
        try
        {
            var ok = await _svnService.CommitAsync(_workingCopyPath, selected, CommitMessage);
            if (ok)
            {
                CommitMessage = string.Empty;
                StatusMessage = "커밋 완료";
                await RefreshAsync();
            }
            else
            {
                StatusMessage = "커밋 실패";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"오류: {ex.Message}";
        }
        finally { IsLoading = false; }
    }

    [RelayCommand]
    private async Task UpdateAsync()
    {
        if (string.IsNullOrEmpty(_workingCopyPath)) return;
        IsLoading = true;
        try
        {
            await _svnService.UpdateAsync(_workingCopyPath);
            StatusMessage = "업데이트 완료";
            await RefreshAsync();
        }
        catch (Exception ex)
        {
            StatusMessage = $"오류: {ex.Message}";
        }
        finally { IsLoading = false; }
    }
}
