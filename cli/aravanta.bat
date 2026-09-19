@echo off
rem Aravanta Cloud OS CLI Launcher for Windows CMD
setlocal
set SCRIPT_DIR=%~dp0
python "%SCRIPT_DIR%aravanta.py" %*
endlocal
