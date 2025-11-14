# Downloads mall images into images/malls using Unsplash source queries
param(
  [string]$OutDir = "images/malls"
)

# Ensure TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Ensure output directory exists
if (!(Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$items = @(
  @{ Name='Sandton City'; File='sandton-city.jpg'; Query='sandton+city+mall+johannesburg+exterior' }
  @{ Name='Mall of Africa'; File='mall-of-africa.jpg'; Query='mall+of+africa+midrand+exterior' }
  @{ Name='Canal Walk'; File='canal-walk.jpg'; Query='canal+walk+mall+cape+town+exterior' }
  @{ Name='V&A Waterfront'; File='va-waterfront.jpg'; Query='v%26a+waterfront+cape+town+mall+exterior' }
  @{ Name='Gateway Theatre of Shopping'; File='gateway-umhlanga.jpg'; Query='gateway+theatre+of+shopping+umhlanga+exterior' }
  @{ Name='Menlyn Park'; File='menlyn-park.jpg'; Query='menlyn+park+mall+pretoria+exterior' }
  @{ Name='Eastgate Mall'; File='eastgate.jpg'; Query='eastgate+mall+johannesburg+exterior' }
  @{ Name='Clearwater Mall'; File='clearwater-mall.jpg'; Query='clearwater+mall+roodepoort+exterior' }
  @{ Name='Cresta Shopping Centre'; File='cresta.jpg'; Query='cresta+shopping+centre+randburg+exterior' }
  @{ Name='Brooklyn Mall'; File='brooklyn-mall.jpg'; Query='brooklyn+mall+pretoria+exterior' }
  @{ Name='The Pavilion'; File='pavilion-westville.jpg'; Query='the+pavilion+mall+westville+exterior' }
  @{ Name='Cavendish Square'; File='cavendish-square.jpg'; Query='cavendish+square+mall+cape+town+exterior' }
  @{ Name='Somerset Mall'; File='somerset-mall.jpg'; Query='somerset+mall+somerset+west+exterior' }
  @{ Name='Rosebank Mall'; File='rosebank-mall.jpg'; Query='rosebank+mall+johannesburg+exterior' }
)

$base = "https://source.unsplash.com/1200x800/?"

function Download-Image([string]$Url, [string]$Dest) {
  try {
    Invoke-WebRequest -Uri $Url -OutFile $Dest -MaximumRedirection 5 -TimeoutSec 60 -Headers @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'; 'Accept'='image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }
    if ((Test-Path $Dest) -and ((Get-Item $Dest).Length -gt 10240)) { return $true }
  } catch { }
  return $false
}

foreach ($i in $items) {
  $dest = Join-Path $OutDir $i.File
  $sig = Get-Random -Minimum 1 -Maximum 100000
  $url = $base + $i.Query + "&sig=$sig"
  Write-Host ("Downloading {0} -> {1}" -f $i.Name, $dest)
  $ok = Download-Image -Url $url -Dest $dest
  if (-not $ok) {
    Write-Warning ("Primary failed, retrying with simplified query for {0}" -f $i.Name)
    $fallback = $base + ($i.Query -replace '\+exterior','')
    $ok = Download-Image -Url $fallback -Dest $dest
  }
  if (-not $ok) { Write-Warning ("Failed: {0}" -f $i.Name) } else { Write-Host ("Saved: {0}" -f $dest) }
}
Write-Host "Done."