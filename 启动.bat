@echo off
setlocal
chcp 65001 >nul
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"
set "PORT=4721"
set "HOSTNAME=127.0.0.1"
set "SITE_CONFIG_PATH=%APP_DIR%data\site-config.json"
set "LLAMA_SERVER_URL=http://127.0.0.1:8742"
if not exist "%APP_DIR%data" mkdir "%APP_DIR%data"
if exist "%APP_DIR%runtime\model\qwen2.5-0.5b-instruct-q4_k_m.gguf" set "LOCAL_MODEL_PATH=%APP_DIR%runtime\model\qwen2.5-0.5b-instruct-q4_k_m.gguf"
if exist "%APP_DIR%runtime\llama\llama-cli.exe" set "LOCAL_LLAMA_CLI=%APP_DIR%runtime\llama\llama-cli.exe"
set "LLAMA_SERVER_EXE=%APP_DIR%runtime\llama\llama-server.exe"

netstat -ano | findstr /R /C:":4721 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo 端口 4721 已在运行中，正在打开浏览器...
  start "" "http://127.0.0.1:4721"
  exit /b 0
)

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
