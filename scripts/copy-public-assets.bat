@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Copying Public Assets
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "SOURCE_DIR=%PROJECT_DIR%\public"
set "TARGET_DIR=%PROJECT_DIR%\.open-next\assets"

echo Creating target directory if needed...
if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
    echo   [+] Created .open-next\assets directory
)

echo.
echo Copying files...
echo.

if exist "%SOURCE_DIR%\favicon.ico" (
    copy /Y "%SOURCE_DIR%\favicon.ico" "%TARGET_DIR%\" >nul
    echo   [OK] favicon.ico
) else (
    echo   [SKIP] favicon.ico (not found)
)

if exist "%SOURCE_DIR%\favicon.svg" (
    copy /Y "%SOURCE_DIR%\favicon.svg" "%TARGET_DIR%\" >nul
    echo   [OK] favicon.svg
) else (
    echo   [SKIP] favicon.svg (not found)
)

if exist "%SOURCE_DIR%\logo.svg" (
    copy /Y "%SOURCE_DIR%\logo.svg" "%TARGET_DIR%\" >nul
    echo   [OK] logo.svg
) else (
    echo   [SKIP] logo.svg (not found)
)

if exist "%SOURCE_DIR%\manifest.json" (
    copy /Y "%SOURCE_DIR%\manifest.json" "%TARGET_DIR%\" >nul
    echo   [OK] manifest.json
) else (
    echo   [SKIP] manifest.json (not found)
)

if exist "%SOURCE_DIR%\robots.txt" (
    copy /Y "%SOURCE_DIR%\robots.txt" "%TARGET_DIR%\" >nul
    echo   [OK] robots.txt
) else (
    echo   [SKIP] robots.txt (not found)
)

if exist "%SOURCE_DIR%\sw.js" (
    copy /Y "%SOURCE_DIR%\sw.js" "%TARGET_DIR%\" >nul
    echo   [OK] sw.js
) else (
    echo   [SKIP] sw.js (not found)
)

echo.
echo ========================================
echo   Copy Complete!
echo ========================================
echo.
echo Files are now in: %TARGET_DIR%
echo.
pause
