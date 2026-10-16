const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Normalize CRLF to LF for matching
const crlf = content.includes('\r\n');
const work = crlf ? content.replace(/\r\n/g, '\n') : content;

// Fix the broken onSubmit handler - flexible regex
const brokenRegex = /            onSubmit=\{(event) => \{\s+event\.preventDefault\(\);\s+constdata = new FormData\(event\.currentTarget\);\s+constnombre = String\(data\.get\('nombre'\) \?\? ''\)\.trim\(\);\s+constinstitucion = String\(data\.get\('institucion'\) \?\? ''\)\.trim\(\);\s+consttelefono = String\(data\.get\('telefono'\) \?\? ''\)\.trim\(\);\s+[\s\S]*?alert\('No se pudocrear la sesión de demo\. Intenta de nuevo\.\)';\s+\}\s+\}/;

const fixed = `            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const nombre = String(data.get('nombre') ?? '').trim();
              const institucion = String(data.get('institucion') ?? '').trim();
              const telefono = String(data.get('telefono') ?? '').trim();
              try {
                const res = await fetch('/api/demo/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone: telefono, nombre, institucion }),
                });
                if (!res.ok) throw new Error('No se pudo crear la sesión de demo.');
                const result = await res.json();
                window.location.href = \`/demo?sessionId=\${result.sessionId}\`;
              } catch (err) {
                console.error(err);
                alert('No se pudo crear la sesión de demo. Intenta de nuevo.');
              }
            }}`;

if (brokenRegex.test(work)) {
  const result = work.replace(brokenRegex, fixed);
  const finalContent = crlf ? result.replace(/\n/g, '\r\n') : result;
  fs.writeFileSync('app/page.tsx', finalContent, 'utf8');
  console.log('onSubmit fixed successfully');
} else {
  console.log('Broken onSubmit not found');
  const idx = work.indexOf('onSubmit=');
  if (idx >= 0) {
    console.log('Context around onSubmit:');
    console.log(JSON.stringify(work.substring(idx, idx + 600)));
  }
}