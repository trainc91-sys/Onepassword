/**
 * Browser Password & Credential Purge Utility
 * Compliance: ISO/IEC 27001:2022 - Control A.9.4.2 & A.9.2.6 (Removal of stored credentials)
 * Agribank Intranet Workstation Standard Operating Procedure
 */

export const BROWSER_CLEANUP_BATCH_SCRIPT = `@echo off
chcp 65001 >nul
title AGRIBANK ONE PASSWORD - DỌN DẸP MẬT KHẨU TRÌNH DUYỆT (ISO 27001)
color 1F

echo ==============================================================================
echo       NGÂN HÀNG NÔNG NGHIỆP VÀ PHÁT TRIỂN NÔNG THÔN VIỆT NAM (AGRIBANK)
echo                CÔNG CỤ DỌN DẸP MẬT KHẨU LƯU TRÊN TRÌNH DUYỆT
echo                  TIÊU CHUẨN AN TOÀN THÔNG TIN: ISO/IEC 27001
echo ==============================================================================
echo.
echo [CẢNH BÁO KIỂM TOÁN NỘI BỘ]:
echo Theo quy định an toàn Agribank, cán bộ KHÔNG ĐƯỢC LƯU mật khẩu các hệ thống
echo nghiệp vụ (IPCAS, CITAD, ĐBCL, E-Office...) trên trình duyệt Chrome / Firefox.
echo.
echo Chương trình này sẽ:
echo 1. Tắt các tiến trình Google Chrome, Mozilla Firefox, Microsoft Edge đang mở.
echo 2. Xóa triệt để tệp 'Login Data' (chứa mật khẩu lưu) của Google Chrome / Edge.
echo 3. Xóa tệp 'logins.json' và 'formhistory.sqlite' của Mozilla Firefox.
echo 4. Giữ nguyên lịch sử duyệt web và dấu trang (Bookmarks) làm việc của cán bộ.
echo.
set /p CONFIRM="Xác nhận thực hiện dọn dẹp bảo mật ngay bây giờ? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Đã hủy thao tác. Nhấn phím bất kỳ để thoát...
    pause >nul
    exit /b
)

echo.
echo [1/4] Đang đóng các tiến trình trình duyệt...
taskkill /f /im chrome.exe >nul 2>&1
taskkill /f /im firefox.exe >nul 2>&1
taskkill /f /im msedge.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Đang xóa dữ liệu mật khẩu lưu trên Google Chrome...
if exist "%LOCALAPPDATA%\\Google\\Chrome\\User Data" (
    del /f /q /s "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\*\\Login Data*" >nul 2>&1
    del /f /q /s "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\*\\Web Data*" >nul 2>&1
    echo   -> Đã quét sạch kho mật khẩu Google Chrome.
) else (
    echo   -> Không phát hiện Google Chrome.
)

echo [3/4] Đang xóa dữ liệu mật khẩu lưu trên Mozilla Firefox...
if exist "%APPDATA%\\Mozilla\\Firefox\\Profiles" (
    del /f /q /s "%APPDATA%\\Mozilla\\Firefox\\Profiles\\*\\logins.json*" >nul 2>&1
    del /f /q /s "%APPDATA%\\Mozilla\\Firefox\\Profiles\\*\\formhistory.sqlite*" >nul 2>&1
    echo   -> Đã quét sạch kho mật khẩu Mozilla Firefox.
) else (
    echo   -> Không phát hiện Mozilla Firefox.
)

echo [4/4] Đang xóa dữ liệu mật khẩu lưu trên Microsoft Edge...
if exist "%LOCALAPPDATA%\\Microsoft\\Edge\\User Data" (
    del /f /q /s "%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\*\\Login Data*" >nul 2>&1
    del /f /q /s "%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\*\\Web Data*" >nul 2>&1
    echo   -> Đã quét sạch kho mật khẩu Microsoft Edge.
) else (
    echo   -> Không phát hiện Microsoft Edge.
)

echo.
echo ==============================================================================
echo [HOÀN TẤT THÀNH CÔNG] Máy trạm đã được bảo vệ đạt chuẩn ISO/IEC 27001.
echo Mọi tài khoản, mật khẩu cần thiết vui lòng quản lý tập trung trên:
echo 'AGRIBANK ONE PASSWORD' để được bảo mật mã hóa AES-256.
echo ==============================================================================
echo.
pause
`;

export const BROWSER_CLEANUP_POWERSHELL_SCRIPT = `# AGRIBANK ONE PASSWORD - ISO 27001 BROWSER CREDENTIAL CLEANER
# Version 2026.1 - Automated Workstation Security Purge

Write-Host "======================================================================" -ForegroundColor Green
Write-Host " AGRIBANK ONE PASSWORD - TIÊU CHUẨN AN TOÀN THÔNG TIN ISO/IEC 27001" -ForegroundColor Yellow
Write-Host " Kịch bản tự động hóa xóa sạch mật khẩu lưu trên Chrome & Firefox" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green

# Kill browser processes
Get-Process chrome, firefox, msedge -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Chrome Cleanup
$chromePath = "$env:LOCALAPPDATA\\Google\\Chrome\\User Data"
if (Test-Path $chromePath) {
    Get-ChildItem -Path $chromePath -Recurse -Include "Login Data*","Web Data*" -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "[OK] Đã thanh tẩy mật khẩu Chrome thành công." -ForegroundColor Green
}

# Firefox Cleanup
$firefoxPath = "$env:APPDATA\\Mozilla\\Firefox\\Profiles"
if (Test-Path $firefoxPath) {
    Get-ChildItem -Path $firefoxPath -Recurse -Include "logins.json*","formhistory.sqlite*" -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "[OK] Đã thanh tẩy mật khẩu Firefox thành công." -ForegroundColor Green
}

# Edge Cleanup
$edgePath = "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data"
if (Test-Path $edgePath) {
    Get-ChildItem -Path $edgePath -Recurse -Include "Login Data*","Web Data*" -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "[OK] Đã thanh tẩy mật khẩu MS Edge thành công." -ForegroundColor Green
}

Write-Host ""
Write-Host "Đã hoàn thành kiểm toán máy trạm Agribank theo chuẩn ISO 27001." -ForegroundColor Cyan
`;

export function downloadScript(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
