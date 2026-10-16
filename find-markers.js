const fs = require('fs');
const c = fs.readFileSync('app/page.tsx', 'utf8');
console.log('CTA idx:', c.indexOf('CTA CONTACTO'));
console.log('FOOTER idx:', c.indexOf('FOOTER'));
const i2 = c.indexOf('FOOTER');
if (i2 >= 0) console.log('Around FOOTER:', JSON.stringify(c.substring(i2-20, i2+40)));
const i1 = c.indexOf('CTA CONTACTO');
if (i1 >= 0) console.log('Around CTA:', JSON.stringify(c.substring(i1-5, i1+30)));