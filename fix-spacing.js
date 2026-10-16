const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const crlf = content.includes('\r\n');
const work = crlf ? content.replace(/\r\n/g, '\n') : content;

const fixes = [
  // Fix broken variable declarations (missing spaces after const)
  ['constdata = new FormData', 'const data = new FormData'],
  ['constnombre = String', 'const nombre = String'],
  ['constinstitucion = String', 'const institucion = String'],
  ['consttelefono = String', 'const telefono = String'],
  ['constsubject = `', 'const subject = `'],
  ['constbody = [', 'const body = ['],
  ['constparams = new URLSearchParams', 'const params = new URLSearchParams'],
  
  // Fix awaitfetch -> await fetch
  ['awaitfetch', 'await fetch'],
  
  // Fix missing space in JSON body
  ['nombre: nombre,institucion', 'nombre: nombre, institucion'],
  
  // Fix "No se pudocrear" -> "No se pudo crear"
  ['No se pudocrear', 'No se pudo crear'],
  
  // Fix JSX tag spacing
  ['<buttontype="submit"', '<button type="submit"'],
  ['inputMode="tel"placeholder', 'inputMode="tel" placeholder'],
  ['href="tel:+576019177737"className', 'href="tel:+576019177737" className'],
  ['py-[14px]">', 'py-[14px]">'],
  ['bg-white/40 placeholder:text-[#7b93ab]outline-none', 'bg-white/40 placeholder:text-[#7b93ab] outline-none'],
];

let changed = false;
for (const [oldStr, newStr] of fixes) {
  if (work.includes(oldStr)) {
    const count = (work.match(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    work = work.split(oldStr).join(newStr);
    changed = true;
    console.log(`Fixed: "${oldStr}" (${count} occurrences)`);
  } else {
    console.log(`NOT FOUND: "${oldStr}"`);
  }
}

if (changed) {
  const finalContent = crlf ? work.replace(/\n/g, '\r\n') : work;
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('\nAll fixes applied successfully!');
} else {
  console.log('\nNo changes were needed.');
}