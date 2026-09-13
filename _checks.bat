@echo off
cd /d .
if exist _checks.log del _checks.log
( echo === git status --short ===
  git status --short
  echo === git diff --stat ===
  git --no-pager diff --stat
  echo === tsc ===
  npx tsc --noEmit
  echo tsc_exit=$?
  echo === vitest ===
  npx vitest run lib/health > _vitest.log 2>&1
  echo vitest_exit=$?
) > _checks.log 2>&1
if errorlevel 1 echo PIPELINE FAILED >> _checks.log
