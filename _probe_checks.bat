@echo off
cd /d .
(
echo === T=1 ===
if exist _checks.log (type _checks.log) else (echo NOLOG_AFTER_1s)
echo === END ===
) > _probe_checks_result.log 2>&1
