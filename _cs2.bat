@echo off
cd /d .
node -e "const fs=require('fs');let b='';let p='_head_cs.txt';try{b=fs.readFileSync(p,'utf8');}catch(e){b='NO FILE';}const l=b.split(/\r?\n/).slice(164,229).join('\n');fs.writeFileSync('_cs.log',l);"
