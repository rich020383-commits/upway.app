@echo off
cd /d c:\Users\ANDRES\Upway\upway-app
git --no-pager diff --stat > _gitdiff.txt 2>&1
echo ----DIFF_DETAIL---- >> _gitdiff.txt
git --no-pager diff -- app/health/onboarding/page.tsx components/health/plan-picker.tsx >> _gitdiff.txt 2>&1
echo GITDIFF_END >> _gitdiff.txt