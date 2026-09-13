@echo off
cd /d .
(
echo === git ===
git --no-pager status --short
git --no-pager diff --stat
echo === node verify ===
node _verify_hdr.js
) > _all.log 2>&1
echo DONE >> _all.log
