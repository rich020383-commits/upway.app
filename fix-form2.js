const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');
const crlf = c.includes('\r\n');
const work = crlf ? c.replace(/\r\n/g, '\n') : c;

const oldBlock = `          <form
            className="shrink-0w-full max-w-[340px] flex flex-col gap-2"
            onSubmit={(event) =>{
 event.preventDefault();
 const data = new FormData(event.currentTarget);
 const nombre = String(data.get('nombre') ?? '').trim();
 const institucion = String(data.get('institucion') ?? '').trim();
 const telefono = String(data.get('telefono') ?? '').trim();
 const subject = \`Solicitud de demo Upway — \${institucion || nombre || 'Nueva solicitud'}\`;
 const body = [
   \`Nombre: \${nombre}\`,
   \`Institución/Empresa: \${institucion}\`,
   \`Teléfono: \${telefono}\`,
   '',
   'Solicito una demo de Upway.',
 ].join('\\n');
 const params = newURLSearchParams();
 if (nombre) params.set('nombre', nombre);
 if (institucion) params.set('institucion', institucion);
 try {
  const res = await fetch('/api/demo/sessions', {
    method: 'POST',
    headers:{ 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: telefono, nombre: nombre, institucion:institucion }),
  });
  if (!res.ok) throw new Error('No se pudo crear la sesión de demo.');
  const data= await res.json();
  window.location.href = \`/demo?sessionId=\${data.sessionId}\`;
} catch (err) {
  console.error(err);
  alert('No se pudo crear la sesión de demo. Intentade nuevo.');
}
          >`;

const newBlock = `          <form
            className="shrink-0 w-full max-w-[340px] flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const nombre = String(formData.get('nombre') ?? '').trim();
              const institucion = String(formData.get('institucion') ?? '').trim();
              const telefono = String(formData.get('telefono') ?? '').trim();
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
            }}
          >`;

if (work.includes(oldBlock)) {
  const result = work.replace(oldBlock, newBlock);
  const finalContent = crlf ? result.replace(/\n/g, '\r\n') : result;
  fs.writeFileSync('app/page.tsx', finalContent, 'utf8');
  console.log('EXITO: Formulario corregido');
} else {
  console.log('FALLO: No se encontro el bloque exacto');
}