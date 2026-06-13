# Tam deploy akisi: test → build → git push → vercel fix → env sync → verify
# Kullanim: npm run deploy:all
# GITHUB_TOKEN .env.local'da veya ortamda olmali (push icin)

param(
    [string]$CommitMessage = "MaxiHesaplama: guncelleme"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repoRoot

& "$repoRoot\scripts\load-env.ps1"

Write-Host "=== 1/6 Test ===" -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== 2/6 Build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== 3/6 Git push ===" -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    git add -A
    git -c user.email="maxijett.omerkacar@gmail.com" -c user.name="maxijettomerkacar-blip" commit -m $CommitMessage
}
if ($env:GITHUB_TOKEN) {
    & "$repoRoot\scripts\github-push.ps1"
} else {
    git push origin main 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Git push atlandi — GITHUB_TOKEN .env.local'a ekleyin veya manuel push yapin"
    } else {
        Write-Host "Git push tamamlandi"
    }
}

Write-Host "`n=== 4/6 Vercel framework fix + redeploy ===" -ForegroundColor Cyan
if ($env:VERCEL_TOKEN) {
    npm run deploy:fix-vercel
} else {
    Write-Warning "VERCEL_TOKEN yok — Vercel fix atlandi"
}

Write-Host "`n=== 5/6 Vercel env sync ===" -ForegroundColor Cyan
if ($env:VERCEL_TOKEN) {
    npm run deploy:sync-vercel
} else {
    Write-Warning "VERCEL_TOKEN yok — Vercel env sync atlandi"
}

Write-Host "`n=== 6/6 Deploy verify (fix + check) ===" -ForegroundColor Cyan
npm run deploy:verify
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`nDeploy akisi tamamlandi." -ForegroundColor Green
if ($env:VERCEL_URL) {
    Write-Host "Canli URL: $env:VERCEL_URL"
}
