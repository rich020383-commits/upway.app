const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const crlf = content.includes('\r\n');
const work = crlf ? content.replace(/\r\n/g, '\n') : content;

// Find the onSubmit block - from "onSubmit={(event) => {" to the closing "}" before ">"
// We need to replace the entire broken handler
const startMarker = 'onSubmit={(event) => {';
const startIdx = work.indexOf(startMarker);
if (startIdx < 0) {
  console.log('No se encontró el inicio de onSubmit');
  process.exit(1);
}

// Find the end of the onSubmit handler - look for the pattern that ends before ">"
// The handler ends with "}" and then ">" for the JSX
// Find from startIdx, look for "const body = [" then find the end after the catch block
const bodyStart = work.indexOf('const body = [', startIdx);
if (bodyStart < 0) {
  console.log('No se encontró const body = [');
  process.exit(1);
}

// Find where the broken handler ends - after "catch (err) {" block closes
// Look for "alert('No se pudo" which is inside catch
const catchIdx = work.indexOf('catch (err)', bodyStart);
if (catchIdx < 0) {
  console.log('No se encontró catch (err)');
  process.exit(1);
}

// Find the end of catch block - look for "}" then ">" (JSX close)
// Actually let's find the end by looking for the pattern after the catch
// The catch block ends with "}" and then there's "          >" (JSX)
const afterCatch = work.indexOf('}', catchIdx + 10);
// Find the next "}" that closes the arrow function, then ">"
// Let's find from afterCatch onwards
let endIdx = afterCatch;
let braceCount = 1;
// Walk forward to find matching closing brace for the arrow function
for (let i = afterCatch + 1; i < work.length; i++) {
  if (work[i] === '{') braceCount++;
  if (work[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      endIdx = i;
      break;
    }
  }
}

// Now find the ">" after endIdx
const jsxClose = work.indexOf('>', endIdx);
if (jsxClose < 0) {
  console.log('No se encontró el cierre JSX >');
  process.exit(1);
}

const oldHandler = work.substring(startIdx, jsxClose + 1);

const newHandler = `onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const nombre = String(data.get('nombre') ?? '').trim();
              const institucion = String(data.get('institucion') ?? '').trim();
              const telefono = String(data.get('telefono') ?? '').trim();
              try {
                const res = await fetch('/api/demo/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone: telefono, nombre: nombre, institucion: institucion }),
                });
                if (!res.ok) throw new Error('No se pudo crear la sesión de demo.');
                const data2 = await res.json();
                window.location.href = \`/demo?sessionId=\${data2.sessionId}\`;
              } catch (err) {
                console.error(err);
                alert('No se pudo crear la sesión de demo. Intenta de nuevo.');
              }
            }}>`;

if (work.includes(oldHandler)) {
  const result = work.replace(oldHandler, newHandler);
  const finalContent = crlf ? result.replace(/\n/g, '\r\n') : result;
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Formulario reparado correctamente');
} else {
  console.log('No se encontró el handler exacto');
  // Debug
  console.log('Start marker found at:', startIdx);
  console.log('Handler length:', oldHandler.length);
  console.log('Handler preview:', JSON.stringify(oldHandler.substring(0, 200)));
}