using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace svnManager.Converters;

public class AuthorToColorConverter : IValueConverter
{
    private static readonly SolidColorBrush[] Palette =
    [
        new(Color.FromRgb(0x61, 0x8C, 0xF0)),
        new(Color.FromRgb(0x5B, 0xB5, 0x74)),
        new(Color.FromRgb(0xD8, 0x85, 0x4C)),
        new(Color.FromRgb(0xC7, 0x6B, 0x9B)),
        new(Color.FromRgb(0x56, 0xB6, 0xC2)),
        new(Color.FromRgb(0xE0, 0x6C, 0x75)),
        new(Color.FromRgb(0x98, 0xC3, 0x79)),
    ];

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is not string author) return Palette[0];
        var idx = Math.Abs(author.GetHashCode()) % Palette.Length;
        return Palette[idx];
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotImplementedException();
}
