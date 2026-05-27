using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;
using svnManager.Models;

namespace svnManager.Converters;

public class DiffLineFgConverter : IValueConverter
{
    private static SolidColorBrush Brush(string hex)
    {
        var c = (Color)ColorConverter.ConvertFromString(hex);
        return new SolidColorBrush(c);
    }

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is DiffLineType lineType)
        {
            return lineType switch
            {
                DiffLineType.Added      => Brush("#3FB950"),
                DiffLineType.Removed    => Brush("#F85149"),
                DiffLineType.Header     => Brush("#768390"),
                DiffLineType.FileHeader => Brush("#545D68"),
                _                       => Brush("#CDD9E5")
            };
        }
        return Brush("#CDD9E5");
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotImplementedException();
}
