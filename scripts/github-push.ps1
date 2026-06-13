# GitHub Push Script
# Token'ı ASLA bu dosyaya yazmayın. Ortam değişkeni kullanın.
#
# PowerShell kullanımı:
#   $env:GITHUB_TOKEN = "ghp_xxxxxxxx"
#   .\scripts\github-push.ps1
#
# İlk kurulum (repo henüz git değilse):
#   git init
#   git branch -M main

param(
    [string]$RemoteUrl = "https://github.com/maxijettomerkacar-blip/hesapkitap.git",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
    Write-Error "GITHUB_TOKEN ortam degiskeni tanimli degil. Ornek: `$env:GITHUB_TOKEN = 'ghp_...'"
    exit 1
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repoRoot

if (-not (Test-Path ".git")) {
    git init
    git branch -M $Branch
}

$remoteName = "origin"
$existingRemote = git remote get-url $remoteName 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add $remoteName $RemoteUrl
} elseif ($existingRemote -ne $RemoteUrl) {
    git remote set-url $remoteName $RemoteUrl
}

git add -A
$status = git status --porcelain
if ($status) {
    git commit -m "MaxiHesaplama: Next.js + Supabase migrasyonu"
}

$pushUrl = $RemoteUrl -replace "https://", "https://maxijettomerkacar-blip:$($env:GITHUB_TOKEN)@"
git push -u $pushUrl $Branch

Write-Host "Push tamamlandi: $RemoteUrl ($Branch)"
