using System.Globalization;
using System.Windows.Data;

namespace svnManager.Converters;

public class StringToInitialConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        => value is string s && s.Length > 0 ? s[0].ToString().ToUpper() : "?";

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotImplementedException();
}
