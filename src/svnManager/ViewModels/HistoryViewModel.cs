using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using svnManager.Models;
using svnManager.Services;
using System.Collections.ObjectModel;

namespace svnManager.ViewModels;

public partial class HistoryViewModel : ObservableObject
{
    private readonly SvnService _svnService;
    private string _workingCopyPath = string.Empty;

    [ObservableProperty]
    private ObservableCollection<SvnLogEntry> _logEntries = new();

    [ObservableProperty]
    private ObservableCollection<SvnLogEntry> _filteredLogEntries = new();

    [ObservableProperty]
    private SvnLogEntry? _selectedEntry;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    [ObservableProperty]
    private string _filterText = string.Empty;

    public HistoryViewModel(SvnService svnService)
    {
        _svnService = svnService;
    }

    partial void OnFilterTextChanged(string value) => RefreshFilter();

    private void RefreshFilter()
    {
        var q = FilterText?.Trim().ToLowerInvariant() ?? string.Empty;
        FilteredLogEntries.Clear();
        foreach (var e in LogEntries)
        {
            if (string.IsNullOrEmpty(q)
                || e.Message.ToLowerInvariant().Contains(q)
                || e.Author.ToLowerInvariant().Contains(q))
                FilteredLogEntries.Add(e);
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
            var entries = await _svnService.GetLogAsync(_workingCopyPath);
            LogEntries.Clear();
            foreach (var e in entries)
                LogEntries.Add(e);
            RefreshFilter();
        }
        catch (Exception ex)
        {
            StatusMessage = $"오류: {ex.Message}";
        }
        finally { IsLoading = false; }
    }
}
