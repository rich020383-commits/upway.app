$ErrorActionPreference = 'SilentlyContinue'
git --no-pager show HEAD:app/health/onboarding/page.tsx 2>$null | Set-Content -Path '_head_cs.txt' -Encoding utf8
$n = (Get-Content '_head_cs.txt' -Raw -ErrorAction SilentlyContinue)
if ($n) {
  $lines = $n -split "`r?`n"
  $slice = $lines[164..228] -join "`n"
  Set-Content -Path '_cs2.log' -Value $slice -Encoding utf8
} else {
  Set-Content -Path '_cs2.log' -Value 'NO FILE' -Encoding utf8
}
