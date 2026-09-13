const fs = require('fs');
const { execSync } = require('child_process');
const p = 'app/health/layout.tsx';
let t = fs.readFileSync(p, 'utf8');
const headerStarts = t.indexOf('<div className="flex flex-wrap items-center gap-2">');
const lineStart = t.lastIndexOf('\n', headerStarts) + 1;
const after = t.slice(lineStart, headerStarts);
const indentOk = after === '          ';
// commit y push
const sha1 = execSync('git rev-parse HEAD', { cwd: '.', stdio: ['ignore','pipe','pipe'] }).toString().trim();
const status = execSync('git status --short', { cwd: '.', stdio: ['ignore','pipe','pipe'] }).toString();
const diffstat = execSync('git --no-pager diff --stat', { cwd: '.', stdio: ['ignore','pipe','pipe'] }).toString();
console.log(JSON.stringify({
  header_indent_ok: indentOk,
  header_indent_raw: JSON.stringify(after),
  sha1,
  wc_status: status.trim().split(/\r?\n/),
  diffstat: diffstat.trim()
}));
