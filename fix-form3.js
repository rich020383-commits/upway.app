const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');
const crlf = c.includes('\r\n');
const work = crlf ? c.replace(/\r\n/g, '\n') : c;
const lines = work.split('\n');

// Remove leftover old lines 1071-1080 (1-indexed) = indices 1070-1079
// These are duplicates of the old code that wasn't replaced
const leftoverStart = 1070; // 0-indexed for line 1071
const leftoverEnd = 1079;   // 0-indexed for line 1080

console.log('Line 1071:', JSON.stringify(lines[leftoverStart]));
console.log('Line 1080:', JSON.stringify(lines[leftoverEnd]));

// Remove lines 1071-1080
lines.splice(leftoverStart, leftoverEnd - leftoverStart + 1);

const result = lines.join('\n');
const finalContent = crlf ? result.replace(/\n/g, '\r\n') : result;
fs.writeFileSync('app/page.tsx', finalContent, 'utf8');
console.log('EXITO: Lineas 1071-1080 eliminadas');