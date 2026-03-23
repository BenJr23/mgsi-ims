@echo off
cd /d "C:\Users\kylee\OneDrive\Desktop\ims\mgsi-ims"

start cmd /c "npm run dev"

timeout /t 5 >nul

start http://localhost:3000

pause