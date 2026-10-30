$bytes = [System.IO.File]::ReadAllBytes('C:\Users\PHATHANBO\.gemini\antigravity\scratch\age-of-towers\src\tileset.jpg')
$b64 = [Convert]::ToBase64String($bytes)
Set-Content -Path 'C:\Users\PHATHANBO\.gemini\antigravity\scratch\age-of-towers\src\tileset_b64.txt' -Value $b64
Write-Host "Done: $($b64.Length) chars"
