$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
$WorkspaceRoot = $PSScriptRoot
$filesUpdated = 0

Write-Host "Starting UTF-8 normalization..."
Write-Host ""

Get-ChildItem -Path $WorkspaceRoot -Recurse -Include *.html, *.css, *.js, *.json, *.md -File |
    Where-Object {
        $_.FullName -notlike "*\node_modules\*" -and
        $_.FullName -notlike "*\archive\*" -and
        $_.Name -notmatch '\.bak(\.|$)'
    } |
    ForEach-Object {
        $content = Get-Content -Path $_.FullName -Raw -Encoding UTF8
        $updated = $content

        $updated = $updated.Replace([string][char]0x201C, '"')
        $updated = $updated.Replace([string][char]0x201D, '"')
        $updated = $updated.Replace([string][char]0x2018, "'")
        $updated = $updated.Replace([string][char]0x2019, "'")
        $updated = $updated.Replace([string][char]0x2013, '-')
        $updated = $updated.Replace([string][char]0x2014, '-')
        $updated = $updated.Replace([string][char]0x00A0, ' ')
        $updated = $updated.Replace([string][char]0xFFFD, ' ')

        $updated = [regex]::Replace($updated, '\u00C2\s', ' ')
        $updated = [regex]::Replace($updated, '\u00C2(?=\S)', '')
        $updated = [regex]::Replace($updated, '\u00E2\S+\s', '')
        $updated = [regex]::Replace($updated, '\u00F0\S+\s', '')
        $updated = [regex]::Replace($updated, '\u00EF\u00B8\u008F', '')

        if ($updated -ne $content) {
            Set-Content -Path $_.FullName -Value $updated -Encoding UTF8
            $filesUpdated++
            Write-Host "Fixed encoding in: $($_.Name)"
        }
    }

Write-Host ""
Write-Host "UTF-8 normalization complete."
Write-Host "Total files updated: $filesUpdated"
