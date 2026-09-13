const fs = require('fs');
const p = 'app/health/layout.tsx';
let t = fs.readFileSync(p, 'utf8');
const E = t.includes('\r\n') ? '\r\n' : '\n';
const anchor = '<div className="flex flex-wrap items-center gap-2">';
const i = t.indexOf(anchor);
if (i < 0) { console.log('no anchor'); process.exit(0); }
const endMarker = '{displayRole}</span>';
const j = t.indexOf(endMarker, i);
const k = t.indexOf('</div>', j);
const blockEnd = k + '</div>'.length;
const replacement = [
  '          <div className="flex flex-wrap items-center gap-2">',
  '            <Link',
  '              href="/health/production"',
  '              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"',
  '            >',
  '              <ShieldCheck size={14} strokeWidth={2.2} />',
  '              Producción',
  '            </Link>',
  '            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Sistema saludable</span>',
  '            <span className="rounded-full border border-[#dfeaff] bg-[#edf4ff] px-3 py-1.5 text-xs font-semibold text-[#1b5ed6]">{displayRole}</span>',
  '          </div>',
].join(E);
t = t.slice(0, i) + replacement + t.slice(blockEnd);
fs.writeFileSync(p, t);
console.log('header block normalized (EOL=' + (E === '\r\n' ? 'CRLF' : 'LF') + ')');
