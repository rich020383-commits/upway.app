@echo off
cd /d .
node -e "const fs=require('fs');let b='';try{b=fs.readFileSync('_head_cs.txt','utf8');}catch(e){b='NO FILE';}const l=b.split(/[\\r\\n]+/).slice(164,229).join('\n');fs.writeFileSync('_cs2.log',l);"
