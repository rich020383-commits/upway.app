const fs = require('fs');
const p = 'app/health/onboarding/page.tsx';
const t = fs.readFileSync(p, 'utf8');
const lines = t.split(/\r?\n/);
const chunk = lines.slice(250 - 1, 446);
fs.writeFileSync('_stageContent.log', chunk.join('\n'));
console.log('wrote ' + chunk.length + ' lines');
