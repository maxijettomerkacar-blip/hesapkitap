# Tam release: test → build → Supabase kontrol → Git push → Vercel env sync → deploy
#
# Kullanim:
#   .\scripts\release.ps1
#   .\scripts\release.ps1 -Message "fix: rapor detayi"
#   .\scripts\release.ps1 -SkipGit
#   .\scripts\release.ps1 -SkipDeploy

param(
    [string]$Message = "chore: guncelleme",
    [switch]$SkipGit,
    [switch]$SkipDeploy,
    [string]$Branch = "main",
    [string]$RemoteUrl = "https://github.com/maxijettomerkacar-blip/hesapkitap.git"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repoRoot

. (Join-Path $repoRoot "scripts\load-env.ps1")

Write-Host "`n=== 1/6 Test ===" -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== 2/6 Env kontrol ===" -ForegroundColor Cyan
npm run env:check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== 3/6 Supabase kontrol ===" -ForegroundColor Cyan
npm run infra:check
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== 4/6 Build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $SkipGit) {
    Write-Host "`n=== 5/6 Git push ===" -ForegroundColor Cyan
    if (-not $env:GITHUB_TOKEN) {
        Write-Warning "GITHUB_TOKEN yok — git push atlandi. .env.local'a ekleyin veya -SkipGit kullanin."
    } else {
        git add -A
        $status = git status --porcelain
        if ($status) {
            git -c user.email="maxijett.omerkacar@gmail.com" -c user.name="maxijettomerkacar-blip" commit -m $Message
        }
        $pushUrl = $RemoteUrl -replace "https://", "https://maxijettomerkacar-blip:$($env:GITHUB_TOKEN)@"
        git push $pushUrl $Branch
        git remote set-url origin $RemoteUrl 2>$null
    }
} else {
    Write-Host "`n=== 5/6 Git (atlandi) ===" -ForegroundColor Yellow
}

if (-not $SkipDeploy) {
    Write-Host "`n=== 6/6 Vercel sync + deploy ===" -ForegroundColor Cyan
    if (-not $env:VERCEL_TOKEN) {
        Write-Error "VERCEL_TOKEN .env.local icinde tanimli degil"
        exit 1
    }
    npm run vercel:sync-env
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    npm run vercel:deploy
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "`n=== 6/6 Vercel (atlandi) ===" -ForegroundColor Yellow
}

Write-Host "`nRelease tamamlandi." -ForegroundColor Green
if ($env:NEXT_PUBLIC_APP_URL) {
    Write-Host "Canli URL: $($env:NEXT_PUBLIC_APP_URL)"
}
