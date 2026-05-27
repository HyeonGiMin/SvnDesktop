using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;
using svnManager.Models;

namespace svnManager.Converters;

public class StatusToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is SvnStatusKind status)
        {
            return status switch
            {
                SvnStatusKind.Modified => new SolidColorBrush(Color.FromRgb(0xF9, 0xA8, 0x25)),
                SvnStatusKind.Added => new SolidColorBrush(Color.FromRgb(0x43, 0xA0, 0x47)),
                SvnStatusKind.Deleted => new SolidColorBrush(Color.FromRgb(0xE5, 0x39, 0x35)),
                SvnStatusKind.Conflicted => new SolidColorBrush(Color.FromRgb(0xE5, 0x39, 0x35)),
                SvnStatusKind.Unversioned => new SolidColorBrush(Color.FromRgb(0x90, 0x90, 0x90)),
                _ => new SolidColorBrush(Colors.Gray)
            };
        }
        return new SolidColorBrush(Colors.Gray);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotImplementedException();
}
