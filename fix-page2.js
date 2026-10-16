const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Normalize CRLF to LF
const crlf = content.includes('\r\n');
let work = crlf ? content.replace(/\r\n/g, '\n') : work = content.replace(/\r\n/g, '\n') : content;

// 1. Fix the broken onSubmit handler
const onSubmitStart = work.indexOf('onSubmit={(event) => {');
if (onSubmitStart >= 0) {
  const formCloseIdx = work.indexOf('>\n            <input name="nombre"', onSubmitStart);
  if (formCloseIdx >= 0) {
    // Find the end of the onSubmit handler (the > that opens the form children)
    // The broken pattern ends with "}" then newline then "          >"
    const endPattern = work.indexOf('\n          >', formCloseIdx);
    if (endPattern >= 0) {
      const oldBlock = work.substring(onSubmitStart, endPattern + '\n          >'.length);
      const newBlock = `            onSubmit={async (event) => {
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
            }}>`;
      work = work.replace(oldBlock, newBlock);
      console.log('onSubmit handler fixed');
    } else {
      console.log('Could not find end of onSubmit block');
    }
  } else {
    console.log('Could not find form input after onSubmit');
  }
} else {
  console.log('onSubmit not found');
}

// 2. Fix spacing issues
work = work.replace(/font-displaytext-/g, 'font-display text-');
work = work.replace(/<buttontype=/g, '<button type=');
work = work.replace(/tel:\+576019177737"className=/g, 'tel:+576019177737" className=');
work = work.replace(/inputMode="tel"placeholder=/g, 'inputMode="tel" placeholder=');
work = work.replace(/convozhumana/g, 'voz humana');
work = work.replace(/nombre: nombre,institucion/g, 'nombre, institucion');
work = work.replace(/constdata/g, 'const data');
work = work.replace(/constnombre/g, 'const nombre');
work = work.replace(/constinstitucion/g, 'const institucion');
work = work.replace(/consttelefono/g, 'const telefono');
work = work.replace(/constsubject/g, 'const subject');
work = work.replace(/constbody/g, 'const body');
work = work.replace(/constparams/g, 'const params');
work = work.replace(/awaitfetch/g, 'await fetch');
work = work.replace(/No se pudocrear/g, 'No se pudo crear');

const finalContent = crlf ? work.replace(/\n/g, '\r\n') : work;
fs.writeFileSync('app/page.tsx', finalContent, 'utf8');
console.log('All fixes applied');