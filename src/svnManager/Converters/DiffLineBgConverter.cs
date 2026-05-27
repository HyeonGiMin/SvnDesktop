using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;
using svnManager.Models;

namespace svnManager.Converters;

public class DiffLineBgConverter : IValueConverter
{
    private static SolidColorBrush Brush(string hex)
    {
        var c = (Color)ColorConverter.ConvertFromString(hex);
        return new SolidColorBrush(c);
    }

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        bool isNum = parameter is string p && p == "num";

        if (value is DiffLineType lineType)
        {
            return lineType switch
            {
                DiffLineType.Added    => isNum ? Brush("#1D3D20") : Brush("#1A3B1D"),
                DiffLineType.Removed  => isNum ? Brush("#3D1E1E") : Brush("#3B1A1A"),
                DiffLineType.Header   => Brush("#1A2233"),
                _                     => new SolidColorBrush(Colors.Transparent)
            };
        }
        return new SolidColorBrush(Colors.Transparent);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotImplementedException();
}
