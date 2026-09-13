@echo off
cd /d .
node _fix_div.js > _fixdiv.log 2>&1
Remove-Item -Force _fix_div.js
