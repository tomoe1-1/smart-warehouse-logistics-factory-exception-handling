@echo off
setlocal
chcp 65001 >nul
title 仓储异常调度软件层（局域网联调与多端协同模式）
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"
set "PORT=4721"
set "HOSTNAME=0.0.0.0"
set "SITE_CONFIG_PATH=%APP_DIR%data\site-config.json"
set "LLAMA_SERVER_URL=http://127.0.0.1:8742"
if not exist "%APP_DIR%data" mkdir "%APP_DIR%data"
if exist "%APP_DIR%runtime\model\qwen2.5-0.5b-instruct-q4_k_m.gguf" set "LOCAL_MODEL_PATH=%APP_DIR%runtime\model\qwen2.5-0.5b-instruct-q4_k_m.gguf"
if exist "%APP_DIR%runtime\llama\llama-cli.exe" set "LOCAL_LLAMA_CLI=%APP_DIR%runtime\llama\llama-cli.exe"
set "LLAMA_SERVER_EXE=%APP_DIR%runtime\llama\llama-server.exe"

netstat -ano | findstr /R /C:"127\.0\.0\.1:4721 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo ============================================================
  echo   检测到端口 4721 当前正以「单机回环模式 127.0.0.1」运行！
  echo   若需开放局域网多终端访问或跨机接收 Webhook，
  echo   请先关闭之前打开的「仓储异常调度软件层」窗口，再重新双击本脚本。
  echo ============================================================
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":4721 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo 端口 4721 已在局域网模式运行中，正在打开浏览器...
  start "" "http://127.0.0.1:4721"
  exit /b 0
)

echo ============================================================
echo   仓储异常调度软件层 - 局域网联调与多终端协同模式
echo ============================================================
powershell -NoProfile -Command "$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -ExpandProperty IPAddress; foreach($ip in $ips){ Write-Host ('  车间平板/同网段访问地址: http://' + $ip + ':4721') -ForegroundColor Cyan; Write-Host ('  WMS Webhook 推送地址:   http://' + $ip + ':4721/api/inbound/wms') -ForegroundColor DarkCyan }"
echo   提示：若其他电脑连不上，请在 Windows 防火墙放行 TCP 4721 端口。
echo   本机离线模型仅绑定 127.0.0.1:8742，不向局域网暴露。
echo ============================================================

set "SPAWNED_LLAMA_PID="
netstat -ano | findstr /R /C:":8742 .*LISTENING" >nul 2>&1
if errorlevel 1 (
  if exist "%LLAMA_SERVER_EXE%" if defined LOCAL_MODEL_PATH (
    set "LLAMA_API_KEY=local-dispatch-8742"
    for /f %%p in ('powershell -NoProfile -Command "$q = [char]34; $argsList = @('-m', ($q + $env:LOCAL_MODEL_PATH + $q), '--host', '127.0.0.1', '--port', '8742', '-c', '2048', '-np', '2', '-ngl', '0', '--jinja', '--api-key', $env:LLAMA_API_KEY); $p = Start-Process -FilePath $env:LLAMA_SERVER_EXE -ArgumentList $argsList -WindowStyle Minimized -PassThru; $p.Id"') do set "SPAWNED_LLAMA_PID=%%p"
  )
)

start "" /B powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 30;$i++){ try { $c = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 4721); $c.Close(); Start-Process 'http://127.0.0.1:4721'; break } catch { Start-Sleep -Milliseconds 500 } }"
"%APP_DIR%runtime\node\node.exe" "%APP_DIR%app\server.js"

if defined SPAWNED_LLAMA_PID (
  taskkill /PID %SPAWNED_LLAMA_PID% /T /F >nul 2>&1
)
endlocal
