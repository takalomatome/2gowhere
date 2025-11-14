Add-Type -AssemblyName System.Drawing

$imageDir = "c:\Users\THLOLELO\Desktop\2gowhere final with unsplash\images"

# Delete old JPG files
Get-ChildItem "$imageDir\placeholder_*.jpg" | Remove-Item -Force

$colors = @(
    [System.Drawing.Color]::FromArgb(102, 126, 234),   # Blue
    [System.Drawing.Color]::FromArgb(240, 147, 251),   # Pink
    [System.Drawing.Color]::FromArgb(79, 172, 254),    # Light Blue
    [System.Drawing.Color]::FromArgb(67, 233, 123),    # Green
    [System.Drawing.Color]::FromArgb(250, 154, 158),   # Coral
    [System.Drawing.Color]::FromArgb(48, 207, 208),    # Teal
    [System.Drawing.Color]::FromArgb(168, 237, 234),   # Cyan
    [System.Drawing.Color]::FromArgb(255, 154, 86),    # Orange
    [System.Drawing.Color]::FromArgb(46, 46, 120),     # Dark Blue
    [System.Drawing.Color]::FromArgb(189, 195, 199),   # Gray
    [System.Drawing.Color]::FromArgb(137, 247, 254),   # Light Cyan
    [System.Drawing.Color]::FromArgb(224, 195, 252)    # Lavender
)

$width = 1920
$height = 1080

for($i = 0; $i -lt 12; $i++) {
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear($colors[$i])
    
    # Add gradient effect
    $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Point(0, 0)),
        (New-Object System.Drawing.Point($width, $height)),
        $colors[$i],
        $colors[($i + 1) % 12]
    )
    $graphics.FillRectangle($grad, 0, 0, $width, $height)
    
    $num = $i + 1
    $filename = "$imageDir\placeholder_$num.png"
    $bitmap.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "Created $filename"
}
