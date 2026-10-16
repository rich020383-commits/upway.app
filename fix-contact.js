const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const startMarker = '{/* CTA CONTACTO */}';
const footerKeyword = 'FOOTER';

const startIdx = content.indexOf(startMarker);
const footerStartIdx = content.indexOf(footerKeyword);

// Find the end of the FOOTER comment block (the */})
let endIdx = -1;
if (footerStartIdx >= 0) {
  // From FOOTER keyword, find the next */}
  const closeIdx = content.indexOf('*/}', footerStartIdx);
  if (closeIdx >= 0) {
    endIdx = closeIdx + 3; // include */}
  }
}

if (startIdx < 0 || endIdx < 0) {
  console.error('No se encontraron los marcadores');
  console.log('CTA idx:', startIdx, 'FOOTER start idx:', footerStartIdx, 'FOOTER end idx:', endIdx);
  process.exit(1);
}

const newSection = `        {/* CTA CONTACTO */}
        <section id="contacto" className="py-[48px] px-5 md:px-[8%] flex flex-col md:flex-row items-center justify-between bg-[linear-gradient(110deg,#103d79,#0b858d)] text-white gap-8">
          <div>
            <small className="text-[13px] text-[#50e1d5] font-semibold block mb-2">Empieza por tu vertical</small>
            <h2 className="font-display text-[28px] max-w-[650px] m-0 font-extrabold leading-[1.2]">
              Tu operación merece una <em className="not-italic text-[#50e1d5]">comunicación más inteligente.</em>
            </h2>
          </div>
          <form
            className="shrink-0 w-full max-w-[340px] flex flex-col gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const nombre = String(formData.get("nombre") ?? "").trim();
              const institucion = String(formData.get("institucion") ?? "").trim();
              const telefono = String(formData.get("telefono") ?? "").trim();

              if (!telefono) {
                alert("Por favor ingresa tu teléfono de contacto.");
                return;
              }

              try {
                const res = await fetch("/api/demo/sessions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone: telefono, nombre, institucion }),
                });
                if (!res.ok) throw new Error("No se pudo crear la sesión de demo.");
                const data = await res.json();
                window.location.href = \`/demo?sessionId=\${data.sessionId}\`;
              } catch (err) {
                console.error(err);
                alert("No se pudo crear la sesión de demo. Intenta de nuevo.");
              }
            }}
          >
            <input name="nombre" required placeholder="Tu nombre" className="rounded-full px-4 py-2.5 text-[13px] text-[#0d3168] bg-white/95 border border-white/40 placeholder:text-[#7b93ab] outline-none focus:ring-2 focus:ring-[#50e1d5]" />
            <input name="institucion" placeholder="Institución, empresa o agencia" className="rounded-full px-4 py-2.5 text-[13px] text-[#0d3168] bg-white/95 border border-white/40 placeholder:text-[#7b93ab] outline-none focus:ring-2 focus:ring-[#50e1d5]" />
            <input name="telefono" required inputMode="tel" placeholder="Teléfono de contacto" className="rounded-full px-4 py-2.5 text-[13px] text-[#0d3168] bg-white/95 border border-white/40 placeholder:text-[#7b93ab] outline-none focus:ring-2 focus:ring-[#50e1d5]" />
            <button type="submit" className="rounded-full font-bold text-[13px] bg-white text-[#123e77] hover:bg-slate-100 transition px-[23px] py-[14px]">
              Solicita una demo gratuita →
            </button>
            <a href="tel:+576019177737" className="text-center text-[11px] text-[#50e1d5] hover:underline">
              o llama ya: +57 601 9177737 — la atiende Sophie, nuestra asistente de IA
            </a>
            <p className="text-center text-[11px] leading-relaxed text-white/85">
              Es nuestro mejor ejemplo de producto: Sophie atiende 24/7 con voz humana, agenda citas en tiempo real,
              responde consultas y prioriza según tus protocolos. ¿Un superrecepcionista o un agente completo para tu empresa? Ella hace las dos.
            </p>
          </form>
        </section>`;

const newContent = content.substring(0, startIdx) + newSection + content.substring(endIdx);

fs.writeFileSync(path, newContent, 'utf8');
console.log('Sección de contacto reemplazada correctamente');
console.log('Desde caracter', startIdx, 'hasta', endIdx + endMarker.length);