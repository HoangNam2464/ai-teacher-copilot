@echo off
chcp 65001 > nul
echo ===================================================
echo Starting AI Teacher Copilot Backend (Spring Boot)...
echo ===================================================

set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "%~dp0..\backend"

for /f "usebackq tokens=1,* delims==" %%A in ("..\.env") do (
    if not "%%A"=="" (
        set "%%A=%%B"
    )
)

call mvnw.cmd spring-boot:run
