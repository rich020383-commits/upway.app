const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');
const crlf = c.includes('\r\n');
let w = crlf ? c.replace(/\r\n/g, '\n') : c;

// Fix 1: form opening - className outside tag, missing async, const without spaces
const old1 = `<form>\n            className="shrink-0 w-full max-w-[340px] flex flex-col gap-2"\n            onSubmit={(event) => {\n              event.preventDefault();\n              constformData = new FormData(event.currentTarget);\n              constnombre = String(formData.get("nombre") ?? "").trim();\n              constinstitucion = String(formData.get("institucion") ?? "").trim();\n              consttelefono = String(formData.get("telefono") ?? "").trim();`;
const new1 = `<form\n            className="shrink-0 w-full max-w-[340px] flex flex-col gap-2"\n            onSubmit={async (event) => {\n              event.preventDefault();\n              const formData = new FormData(event.currentTarget);\n              const nombre = String(formData.get("nombre") ?? "").trim();\n              const institucion = String(formData.get("institucion") ?? "").trim();\n              const telefono = String(formData.get("telefono") ?? "").trim();`;

if (w.includes(old1)) {
  w = w.replace(old1, new1);
  console.log('Fix 1 OK');
} else {
  console.log('Fix 1 FAIL - not found');
}

// Fix 2: Remove the duplicated/trailing code after the catch block
const old2 = `          }\n    body: JSON.stringify({ phone: telefono, nombre: nombre,institucion: institucion }),\n  });\n  if (!res.ok) throw new Error('No se pudo crear la sesión de demo.');\n  const data = await res.json();\n  window.location.href = \`/demo?sessionId=\${data.sessionId}\`;\n} catch (err) {\n  console.error(err);\n  alert('No se pudocrear la sesión de demo. Intenta de nuevo.');\n}\n          >`;
const new2 = `          }\n          >`;

if (w.includes(old2)) {
  w = w.replace(old2, new2);
  console.log('Fix 2 OK');
} else {
  console.log('Fix 2 FAIL - not found');
}

const out = crlf ? w.replace(/\n/g, '\r\n') : w;
fs.writeFileSync('app/page.tsx', out, 'utf8');
console.log('Parte 1 completada');