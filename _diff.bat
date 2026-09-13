@echo off
cd /d .
if exist _diff.log del _diff.log
git --no-pager diff -- app/health/layout.tsx > _diff.log 2>&1

