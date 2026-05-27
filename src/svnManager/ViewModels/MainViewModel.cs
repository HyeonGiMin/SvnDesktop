using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using svnManager.Models;
using svnManager.Services;
using System.Collections.ObjectModel;

namespace svnManager.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly RepositoryStore _store = new();
    private readonly SvnService _svnService = new();

    [ObservableProperty]
    private ObservableCollection<Repository> _repositories = new();

    [ObservableProperty]
    private ObservableCollection<Repository> _filteredRepositories = new();

    [ObservableProperty]
    private Repository? _selectedRepository;

    [ObservableProperty]
    private ObservableObject? _currentView;

    [ObservableProperty]
    private bool _isChangesTabActive = true;

    [ObservableProperty]
    private bool _isHistoryTabActive;

    [ObservableProperty]
    private bool _isRepoDropdownOpen;

    [ObservableProperty]
    private string _repoSearchText = string.Empty;

    [ObservableProperty]
    private string _filterText = string.Empty;

    [ObservableProperty]
    private string _svnUrl = string.Empty;

    public ChangesViewModel ChangesVM { get; }
    public HistoryViewModel HistoryVM { get; }

    public MainViewModel()
    {
        ChangesVM = new ChangesViewModel(_svnService);
        HistoryVM = new HistoryViewModel(_svnService);
        CurrentView = ChangesVM;

        var saved = _store.Load();
        foreach (var r in saved)
            Repositories.Add(r);

        RefreshFilter();
    }

    partial void OnFilterTextChanged(string value)
    {
        ChangesVM.FilterText = value;
        HistoryVM.FilterText = value;
    }

    partial void OnIsChangesTabActiveChanged(bool value)
    {
        if (value) FilterText = string.Empty;
    }

    partial void OnRepoSearchTextChanged(string value) => RefreshFilter();

    partial void OnSelectedRepositoryChanged(Repository? value)
    {
        if (value is null) return;
        SvnUrl = string.Empty;
        ChangesVM.LoadAsync(value.LocalPath);
        HistoryVM.LoadAsync(value.LocalPath);
        // Best-effort SVN URL fetch
        _ = TryLoadSvnUrlAsync(value.LocalPath);
    }

    private async Task TryLoadSvnUrlAsync(string localPath)
    {
        try
        {
            var url = await _svnService.GetSvnUrlAsync(localPath);
            SvnUrl = url ?? string.Empty;
        }
        catch
        {
            SvnUrl = string.Empty;
        }
    }

    private void RefreshFilter()
    {
        var q = RepoSearchText.Trim().ToLowerInvariant();
        FilteredRepositories.Clear();
        foreach (var r in Repositories)
        {
            if (string.IsNullOrEmpty(q)
                || r.Name.ToLowerInvariant().Contains(q)
                || r.LocalPath.ToLowerInvariant().Contains(q))
                FilteredRepositories.Add(r);
        }
    }

    [RelayCommand]
    private void ToggleRepoDropdown()
    {
        RepoSearchText = string.Empty;
        IsRepoDropdownOpen = !IsRepoDropdownOpen;
    }

    [RelayCommand]
    private void SelectRepository(Repository? repo)
    {
        if (repo is null) return;
        SelectedRepository = repo;
        IsRepoDropdownOpen = false;
        RepoSearchText = string.Empty;
    }

    [RelayCommand]
    private void ShowChanges()
    {
        CurrentView = ChangesVM;
        IsChangesTabActive = true;
        IsHistoryTabActive = false;
    }

    [RelayCommand]
    private void ShowHistory()
    {
        CurrentView = HistoryVM;
        IsChangesTabActive = false;
        IsHistoryTabActive = true;
    }

    [RelayCommand]
    private void AddRepository()
    {
        IsRepoDropdownOpen = false;
        var dialog = new Microsoft.Win32.OpenFolderDialog
        {
            Title = "SVN 작업 복사본 폴더를 선택하세요"
        };
        if (dialog.ShowDialog() != true) return;
        var path = dialog.FolderName;
        if (!System.IO.Directory.Exists(System.IO.Path.Combine(path, ".svn")))
        {
            System.Windows.MessageBox.Show(
                "선택한 폴더는 SVN 작업 복사본이 아닙니다.\n(.svn 폴더가 없습니다)",
                "저장소 추가 오류",
                System.Windows.MessageBoxButton.OK,
                System.Windows.MessageBoxImage.Warning);
            return;
        }
        var name = System.IO.Path.GetFileName(path);
        var repo = new Repository { Name = name, LocalPath = path };
        Repositories.Add(repo);
        _store.Save(Repositories);
        RefreshFilter();
        SelectedRepository = repo;
    }

    [RelayCommand]
    private void RemoveRepository(Repository? repo)
    {
        if (repo is null) return;
        Repositories.Remove(repo);
        _store.Save(Repositories);
        RefreshFilter();
        if (SelectedRepository == repo)
            SelectedRepository = Repositories.FirstOrDefault();
    }
}
