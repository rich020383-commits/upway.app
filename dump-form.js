const fs = require('fs');
const c = fs.readFileSync('app/page.tsx', 'utf8');
const lines = c.split(/\r?\n/);
for (let i = 1040; i <= 1080 && i < lines.length; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}