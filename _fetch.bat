@echo off
cd /d c:\Users\ANDRES\Upway\upway-app
echo START %date% %time% > _fetch.log
curl.exe -s -o _landing.html -w "LANDING_HTTP_%{http_code} BYTES_%{size_download}" http://localhost:3000/ >> _fetch.log 2>&1
curl.exe -s -o _onboarding.html -w "ONBOARDING_HTTP_%{http_code} BYTES_%{size_download}" http://localhost:3000/health/onboarding >> _fetch.log 2>&1
echo FETCH_END %date% %time% >> _fetch.log