const fs = require('fs');
const p = 'app/health/layout.tsx';
let t = fs.readFileSync(p, 'utf8');
const before = t;
t = t.replace(
  /^[\t ]*<div className="flex flex-wrap items-center gap-2">$/m,
  '          <div className="flex flex-wrap items-center gap-2">'
);
fs.writeFileSync(p, t);
console.log(t === before ? 'NO CHANGE' : 'div indent normalized to 10 spaces');
