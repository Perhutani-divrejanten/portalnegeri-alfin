$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
$WorkspaceRoot = $PSScriptRoot
Set-Location $WorkspaceRoot

$mainPages = @(
    'index.html',
    'news.html',
    'contact.html',
    'search.html',
    'login.html',
    'register.html',
    'clearstorage.html',
    'debug-images.html',
    'testauth.html'
)

$docFiles = @(
    'AUTOMATION_README.md',
    'GOOGLE_DRIVE_GUIDE.md',
    'netlify.toml'
)

$counts = [ordered]@{
    MainPages   = 0
    ArticlePages = 0
    Css         = 0
    Package     = 0
    Docs        = 0
}

$brandLogo = '<span class="brand-portal" style="font-weight: 700; color: #15803D; font-size: 24px; letter-spacing: -0.5px;">PORTAL</span><span class="brand-negeri" style="color: #1F5F7F; font-weight: 500; font-size: 18px; margin-left: 2px;">NEGERI</span>'

if (Test-Path '.\articles.json') {
    Copy-Item '.\articles.json' '.\articles.json.bak' -Force
    $timestampBackup = ".\articles.json.bak.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item '.\articles.json' $timestampBackup -Force
}

function Apply-CommonReplacements {
    param([string]$Content)

    $updated = $Content
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

    $updated = $updated -replace 'Warta Janten', 'Portal Negeri'
    $updated = $updated -replace 'WartaJanten', 'PortalNegeri'
    $updated = $updated -replace 'wartajanten', 'portalnegeri'
    $updated = $updated -replace 'Indonesia Daily', 'Portal Negeri'
    $updated = $updated -replace 'IndonesiaDaily', 'PortalNegeri'
    $updated = $updated -replace 'indonesiadaily', 'portalnegeri'
    $updated = $updated -replace 'News - PortalNegeri', 'News - Portal Negeri'

    $updated = $updated -replace '(?i)https?:\/\/(?:www\.)?twitter\.com(?:\/@?[A-Za-z0-9_.-]+)?', 'https://twitter.com/portalnegeri'
    $updated = $updated -replace '(?i)https?:\/\/(?:www\.)?facebook\.com(?:\/[A-Za-z0-9_.-]+)?', 'https://facebook.com/portalnegeri'
    $updated = $updated -replace '(?i)https?:\/\/(?:www\.)?instagram\.com(?:\/[A-Za-z0-9_.-]+)?', 'https://instagram.com/portalnegeri'
    $updated = $updated -replace '(?i)https?:\/\/(?:www\.)?youtube\.com(?:\/@?[A-Za-z0-9_.-]+)?', 'https://youtube.com/@portalnegeri'
    $updated = $updated -replace '(?i)https?:\/\/(?:www\.)?linkedin\.com\/company(?:\/[A-Za-z0-9_.-]+)?', 'https://linkedin.com/company/portalnegeri'
    $updated = $updated -replace '(?i)https?:\/\/mail\.google\.com\/mail\/[^"\s<]*', 'https://mail.google.com/mail/?view=cm&fs=1&to=portalnegeri@gmail.com'
    $updated = $updated -replace '(?i)(?:warta|indonesia)[^"''\s<]*@gmail\.com', 'portalnegeri@gmail.com'

    return $updated
}

function Add-Count {
    param(
        [string]$RelativePath,
        [string]$Bucket = ''
    )

    switch ($Bucket) {
        'Package' { $counts.Package++; return }
        'Docs'    { $counts.Docs++; return }
    }

    if ($mainPages -contains $RelativePath) {
        $counts.MainPages++
    } elseif ($RelativePath -like 'article/*.html') {
        $counts.ArticlePages++
    } elseif ($RelativePath -like 'css/*.css') {
        $counts.Css++
    } elseif (@('package.json', 'package-lock.json', 'tools/package.json') -contains $RelativePath) {
        $counts.Package++
    } elseif ($docFiles -contains $RelativePath) {
        $counts.Docs++
    }
}

Get-ChildItem -Path $WorkspaceRoot -Recurse -Include *.html | ForEach-Object {
    if ($_.PSIsContainer -or $_.FullName -like '*\node_modules\*' -or $_.Name -match '\.bak(\.|$)') {
        return
    }

    $file = $_
    $relativePath = $file.FullName.Substring($WorkspaceRoot.Length + 1).Replace('\', '/')
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $updated = Apply-CommonReplacements -Content $content

    $updated = [regex]::Replace(
        $updated,
        '(?is)<a([^>]*class="[^"]*navbar-brand[^"]*"[^>]*)>.*?</a>',
        { param($m) '<a' + $m.Groups[1].Value + '>' + $brandLogo + '</a>' }
    )

    $updated = [regex]::Replace($updated, '(?is)<img[^>]*src=["''][^"'']*logo\.(?:png|svg)["''][^>]*>\s*', '')
    $updated = $updated -replace 'alt="(?:Portal Negeri|PortalNegeri|IndonesiaDaily|WartaJanten)"', 'alt="PortalNegeri"'

    if ($relativePath -like 'article/*.html') {
        $updated = $updated -replace 'href="index\.html" class="navbar-brand', 'href="../index.html" class="navbar-brand'
    }

    if ($updated -ne $content) {
        Set-Content -Path $file.FullName -Value $updated -Encoding UTF8
        Add-Count -RelativePath $relativePath
    }
}

Get-ChildItem -Path $WorkspaceRoot -Recurse -Include *.css -File |
    Where-Object { $_.FullName -notlike '*\node_modules\*' -and $_.Name -notmatch '\.bak(\.|$)' } |
    ForEach-Object {
        $file = $_
        $relativePath = $file.FullName.Substring($WorkspaceRoot.Length + 1).Replace('\', '/')
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $updated = Apply-CommonReplacements -Content $content

        $updated = $updated -replace '--primary:\s*#[0-9A-Fa-f]{6}', '--primary: #15803D'
        $updated = $updated -replace '--dark:\s*#[0-9A-Fa-f]{6}', '--dark: #052E16'
        $updated = $updated -replace '--secondary:\s*#[0-9A-Fa-f]{6}', '--secondary: #1F5F7F'
        $updated = $updated -replace '#FFCC00', '#15803D'
        $updated = $updated -replace '#ffcc00', '#15803D'
        $updated = $updated -replace '#1E2024', '#052E16'
        $updated = $updated -replace '#1e2024', '#052E16'
        $updated = $updated -replace '#31404B', '#1F5F7F'
        $updated = $updated -replace '#31404b', '#1F5F7F'

        if ($updated -ne $content) {
            Set-Content -Path $file.FullName -Value $updated -Encoding UTF8
            Add-Count -RelativePath $relativePath
        }
    }

$packageFiles = @('package.json', 'package-lock.json', 'tools/package.json')
foreach ($relativePath in $packageFiles) {
    $fullPath = Join-Path $WorkspaceRoot $relativePath
    if (-not (Test-Path $fullPath)) {
        continue
    }

    $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
    $updated = $content

    try {
        $json = $content | ConvertFrom-Json

        switch ($relativePath) {
            'package.json' {
                $json.name = 'portalnegeri'
            }
            'package-lock.json' {
                $json.name = 'portalnegeri'
                if ($json.packages.'') {
                    $json.packages.''.name = 'portalnegeri'
                }
            }
            'tools/package.json' {
                $json.name = 'portalnegeri-article-generator'
                $json.description = 'Generator artikel otomatis dari Google Sheets untuk Portal Negeri'
                $json.author = 'Portal Negeri Team'
                if ($json.keywords) {
                    $json.keywords = @('portalnegeri', 'generator', 'google-sheets', 'html')
                }
            }
        }

        $updated = $json | ConvertTo-Json -Depth 100
    } catch {
        $updated = Apply-CommonReplacements -Content $content
    }

    if ($updated -ne $content) {
        Set-Content -Path $fullPath -Value $updated -Encoding UTF8
        Add-Count -RelativePath $relativePath -Bucket 'Package'
    }
}

foreach ($relativePath in $docFiles) {
    $fullPath = Join-Path $WorkspaceRoot $relativePath
    if (-not (Test-Path $fullPath)) {
        continue
    }

    $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
    $updated = Apply-CommonReplacements -Content $content

    if ($updated -ne $content) {
        Set-Content -Path $fullPath -Value $updated -Encoding UTF8
        Add-Count -RelativePath $relativePath -Bucket 'Docs'
    }
}

Write-Host "Main pages: $($counts.MainPages)"
Write-Host "Article pages: $($counts.ArticlePages)"
Write-Host "CSS files: $($counts.Css)"
Write-Host "Package files: $($counts.Package)"
Write-Host "Docs: $($counts.Docs)"
Write-Host ('Rebrand Portal Negeri selesai ' + [char]0x2705)