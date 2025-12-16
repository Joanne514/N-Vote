# Vercel 自动部署脚本
# 使用方法: .\deploy-to-vercel.ps1

Write-Host "=== Vercel 部署脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确的目录
if (-not (Test-Path "ui\packages\nextjs\package.json")) {
    Write-Host "错误: 请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 进入 Next.js 项目目录
Set-Location "ui\packages\nextjs"

Write-Host "步骤 1: 检查 Vercel CLI..." -ForegroundColor Yellow
$vercelVersion = npx vercel --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Vercel CLI 未找到" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Vercel CLI 版本: $vercelVersion" -ForegroundColor Green

Write-Host ""
Write-Host "步骤 2: 检查登录状态..." -ForegroundColor Yellow
$whoami = npx vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ 未登录，需要登录 Vercel" -ForegroundColor Yellow
    Write-Host "请运行: npx vercel login" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "登录后，运行以下命令部署:" -ForegroundColor Cyan
    Write-Host "  npx vercel --prod" -ForegroundColor White
    exit 0
}
Write-Host "✓ 已登录为: $whoami" -ForegroundColor Green

Write-Host ""
Write-Host "步骤 3: 开始部署..." -ForegroundColor Yellow
Write-Host "提示: 按照提示选择项目设置" -ForegroundColor Cyan
Write-Host ""

# 部署到生产环境
npx vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== 部署完成! ===" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== 部署失败 ===" -ForegroundColor Red
    Write-Host "请检查错误信息并重试" -ForegroundColor Yellow
}

# 返回原目录
Set-Location ..\..\..


