@echo off
cd /d .
git --no-pager show HEAD:app/health/onboarding/page.tsx > _head_cs.txt 2>&1
sed -n '165,230p' _head_cs.txt > _cs.log 2>&1
