const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf8');
const crlf = content.includes('\r\n');
const work = crlf ? content.replace(/\r\n/g, '\n') : content;

const oldBlockRegex = /             const params = new URLSearchParams\(\);\n      if \(nombre\) params\.set\('nombre', nombre\);\n   if \(institucion\)params\.set\('institucion', institucion\);\n              try \{/;

const newBlock = "              try {";

if (work.includes(oldBlock)) {
  const result = work.replace(oldBlock, newBlock);
  const finalContent = crlf ? result.replace(/\n/g, '\r\n') : result;
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Formulario fix aplicado correctamente');
} else {
  console.log('No se encontr� el bloque exacto');
  const idx = work.indexOf('const params = new URLSearchParams');
  if (idx >= 0) {
    console.log('Contexto:', JSON.stringify(work.substring(idx - 20, idx + 200)));
  }
}
