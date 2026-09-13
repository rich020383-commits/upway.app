@echo off
cd /d .
node - <<'NODEEOF' > _stageContent.log 2>&1
const fs = require('fs');
const p = 'app/health/onboarding/page.tsx';
const t = fs.readFileSync(p, 'utf8');
const lines = t.split(/\r?\n/);
const chunk = lines.slice(250 - 1, 446);
console.log(chunk.join('\n'));
NODEEOF
