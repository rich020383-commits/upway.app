@echo off
cd /d c:\Users\ANDRES\Upway\upway-app
echo START %date% %time% > _verify.log
call npm run lint >> _verify.log 2>&1
echo LINT_EXIT=%ERRORLEVEL% >> _verify.log
call npx tsc --noEmit >> _verify.log 2>&1
echo TSC_EXIT=%ERRORLEVEL% >> _verify.log
echo END %date% %time% >> _verify.log