# getcli installer for Windows — https://getcli.dev
# Usage: irm https://getcli.dev/install.ps1 | iex

$ErrorActionPreference = "Stop"

$Repo = "theagentservice/getcli"
$Target = "x86_64-pc-windows-msvc"
$InstallDir = if ($env:GETCLI_INSTALL_DIR) { $env:GETCLI_INSTALL_DIR } else { "$env:LOCALAPPDATA\getcli\bin" }

function Main {
    Write-Host "getcli: detecting latest version..."

    $Release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest"
    $Version = $Release.tag_name

    if (-not $Version) {
        Write-Error "getcli: failed to determine latest version."
        exit 1
    }

    $Url = "https://github.com/$Repo/releases/download/$Version/getcli-$Target.zip"

    Write-Host "getcli: installing getcli $Version for $Target..."

    $TempDir = New-TemporaryFile | ForEach-Object {
        Remove-Item $_
        New-Item -ItemType Directory -Path "$($_.FullName)_dir"
    }
    $ZipPath = Join-Path $TempDir.FullName "getcli.zip"

    try {
        Invoke-WebRequest -Uri $Url -OutFile $ZipPath
        Expand-Archive -Path $ZipPath -DestinationPath $TempDir.FullName -Force

        if (-not (Test-Path $InstallDir)) {
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        }

        $BinPath = Join-Path $InstallDir "getcli.exe"
        Copy-Item (Join-Path $TempDir.FullName "getcli.exe") $BinPath -Force

        Write-Host "getcli: installed getcli to $BinPath"

        # Check PATH
        $UserPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($UserPath -notlike "*$InstallDir*") {
            Write-Host ""
            Write-Host "getcli: warning: $InstallDir is not in your PATH."
            Write-Host "getcli: adding to user PATH..."
            [Environment]::SetEnvironmentVariable("PATH", "$UserPath;$InstallDir", "User")
            $env:PATH = "$env:PATH;$InstallDir"
            Write-Host "getcli: added to PATH. Restart your terminal to use 'getcli'."
        }

        Write-Host ""
        Write-Host "getcli: run 'getcli --help' to get started."
    }
    finally {
        Remove-Item -Recurse -Force $TempDir.FullName -ErrorAction SilentlyContinue
    }
}

Main
