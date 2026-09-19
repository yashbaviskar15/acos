# Aravanta Cloud OS CLI Launcher for Windows PowerShell
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
python "$ScriptDir\aravanta.py" @args
