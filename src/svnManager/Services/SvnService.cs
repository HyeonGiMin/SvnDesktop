using System.IO;
using SharpSvn;
using svnManager.Models;

namespace svnManager.Services;

public class SvnService
{
    public async Task<List<SvnFileStatus>> GetStatusAsync(string workingCopyPath)
    {
        return await Task.Run(() =>
        {
            var result = new List<SvnFileStatus>();
            using var client = new SvnClient();
            var args = new SvnStatusArgs { Depth = SvnDepth.Infinity, RetrieveIgnoredEntries = false };

            client.Status(workingCopyPath, args, (_, e) =>
            {
                if (e.LocalNodeStatus == SvnStatus.Normal || e.LocalNodeStatus == SvnStatus.None) return;
                result.Add(new SvnFileStatus
                {
                    Path = e.FullPath,
                    RelativePath = System.IO.Path.GetRelativePath(workingCopyPath, e.FullPath),
                    Status = MapStatus(e.LocalNodeStatus),
                    IsChecked = e.LocalNodeStatus != SvnStatus.NotVersioned
                });
            });

            return result;
        });
    }

    public async Task<bool> CommitAsync(string workingCopyPath, IEnumerable<string> paths, string message)
    {
        return await Task.Run(() =>
        {
            using var client = new SvnClient();
            var args = new SvnCommitArgs { LogMessage = message };
            var targets = new System.Collections.ObjectModel.Collection<string>(paths.ToList());
            return client.Commit(targets, args, out _);
        });
    }

    public async Task<List<SvnLogEntry>> GetLogAsync(string workingCopyPath, int limit = 100)
    {
        return await Task.Run(() =>
        {
            var result = new List<SvnLogEntry>();
            using var client = new SvnClient();
            var args = new SvnLogArgs { Limit = limit, RetrieveChangedPaths = true };

            client.Log(workingCopyPath, args, (_, e) =>
            {
                result.Add(new SvnLogEntry
                {
                    Revision = e.Revision,
                    Author = e.Author ?? string.Empty,
                    Date = e.Time,
                    Message = e.LogMessage ?? string.Empty,
                    ChangedPaths = e.ChangedPaths?.Select(p => new SvnChangedPath
                    {
                        Path = p.Path,
                        Action = p.Action.ToString()
                    }).ToList() ?? new()
                });
            });

            return result;
        });
    }

    public async Task<string> GetDiffAsync(string filePath)
    {
        return await Task.Run(() =>
        {
            using var client = new SvnClient();
            using var stream = new MemoryStream();
            client.Diff(new SvnPathTarget(filePath, SvnRevision.Base),
                        new SvnPathTarget(filePath, SvnRevision.Working),
                        new SvnDiffArgs(), stream);
            stream.Position = 0;
            return new StreamReader(stream).ReadToEnd();
        });
    }

    public async Task UpdateAsync(string workingCopyPath)
    {
        await Task.Run(() =>
        {
            using var client = new SvnClient();
            client.Update(workingCopyPath);
        });
    }

    public async Task<string?> GetSvnUrlAsync(string workingCopyPath)
    {
        return await Task.Run(() =>
        {
            using var client = new SvnClient();
            if (client.GetInfo(workingCopyPath, out SvnInfoEventArgs info))
                return info.Uri?.ToString();
            return null;
        });
    }

    private static SvnStatusKind MapStatus(SvnStatus status) => status switch
    {
        SvnStatus.Modified => SvnStatusKind.Modified,
        SvnStatus.Added => SvnStatusKind.Added,
        SvnStatus.Deleted => SvnStatusKind.Deleted,
        SvnStatus.Conflicted => SvnStatusKind.Conflicted,
        SvnStatus.NotVersioned => SvnStatusKind.Unversioned,
        SvnStatus.Missing => SvnStatusKind.Missing,
        SvnStatus.Replaced => SvnStatusKind.Replaced,
        _ => SvnStatusKind.Normal
    };
}
