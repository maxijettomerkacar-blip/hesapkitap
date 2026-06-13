# Vercel ortam degiskenlerini .env.local'dan senkronize eder
# Kullanim: npm run deploy:sync-vercel

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repoRoot

& "$repoRoot\scripts\load-env.ps1"

if (-not $env:VERCEL_TOKEN) {
    Write-Error "VERCEL_TOKEN .env.local icinde tanimli olmali"
    exit 1
}

$varsToSync = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL"
)

$targets = @("production", "preview", "development")

foreach ($name in $varsToSync) {
    $value = (Get-Item "env:$name" -ErrorAction SilentlyContinue).Value
    if (-not $value) {
        Write-Warning "Atlandi (bos): $name"
        continue
    }
    foreach ($target in $targets) {
        Write-Host "Vercel env: $name [$target]"
        npx --yes vercel env rm $name $target --yes --token $env:VERCEL_TOKEN 2>$null
        $value | npx --yes vercel env add $name $target --token $env:VERCEL_TOKEN
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Vercel env eklenemedi: $name ($target)"
        }
    }
}

Write-Host "`nVercel env senkronizasyonu tamamlandi."
Write-Host "Not: SUPABASE_SERVICE_ROLE_KEY Vercel'e EKLENMEZ (guvenlik)."
