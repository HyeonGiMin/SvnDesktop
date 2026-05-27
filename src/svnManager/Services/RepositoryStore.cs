using System.IO;
using System.Text.Json;
using svnManager.Models;

namespace svnManager.Services;

public class RepositoryStore
{
    private static readonly string StorePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "svnManager", "repositories.json");

    public List<Repository> Load()
    {
        try
        {
            if (!File.Exists(StorePath)) return new();
            var json = File.ReadAllText(StorePath);
            return JsonSerializer.Deserialize<List<Repository>>(json) ?? new();
        }
        catch
        {
            return new();
        }
    }

    public void Save(IEnumerable<Repository> repositories)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(StorePath)!);
        var json = JsonSerializer.Serialize(repositories.ToList(), new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(StorePath, json);
    }
}
