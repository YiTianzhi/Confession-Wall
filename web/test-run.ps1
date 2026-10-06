# ============================================================
#  本地试运行脚本
#  功能：一键启动 PostgreSQL + 开发服务器，测试结束后自动删除所有测试内容
#  用法：在 PowerShell 中进入 web 目录后执行：  .\test-run.ps1
# ============================================================

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 直接用本地 node 运行，避免依赖全局 npm / npx（即使 npm 有问题也不影响）
$prismaCli = "node_modules\prisma\build\index.js"
$nextCli   = "node_modules\next\dist\bin\next"

function Reset-Database {
    Write-Host "`n==> 清空数据库（删除所有测试内容）..." -ForegroundColor Yellow
    node $prismaCli db push --force-reset | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "数据库重置失败"
    }
}

# 1. 检查 Docker 是否在运行
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker 未运行，请先启动 Docker Desktop。" -ForegroundColor Red
    exit 1
}

# 2. 启动 PostgreSQL 容器
Write-Host "==> 启动 PostgreSQL 容器..." -ForegroundColor Cyan
docker compose up -d | Out-Null

# 3. 等待数据库就绪
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    docker compose exec -T db pg_isready -U wall *> $null
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Write-Host "PostgreSQL 未能在预期时间内就绪。" -ForegroundColor Red
    exit 1
}

# 4. 释放 3000 端口（防止上次残留进程占用）
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# 5. 从干净状态开始测试
Reset-Database

# 6. 启动开发服务器
Write-Host "==> 启动开发服务器..." -ForegroundColor Cyan
$server = Start-Process -FilePath "node" -ArgumentList $nextCli, "dev", "-p", "3000" -PassThru -NoNewWindow
Start-Sleep -Seconds 6
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "测试完成后，回到这个窗口按回车键：将自动停止服务器并删除全部测试内容。" -ForegroundColor Green
Read-Host | Out-Null

# 7. 停止服务器（连同子进程一起结束）
Write-Host "==> 停止服务器..." -ForegroundColor Cyan
if (-not $server.HasExited) {
    taskkill /PID $server.Id /T /F 2>$null | Out-Null
}

# 8. 删除测试内容
Reset-Database

Write-Host ""
Write-Host "完成：测试内容已删除，数据库已清空，PostgreSQL 容器仍在运行。" -ForegroundColor Green
