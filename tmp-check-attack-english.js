const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('src/components/data/attack.json','utf8'));
const englishHint=/(\btarget\b|\bcreature\b|\bdeal\b|\bgain\b|\blose\b|\bif\b|\bchallenge\b|\bfire\b|\bwater\b|\bair\b|\bearth\b|\battack\b|\bdamage\b)/i;
let names=0,descs=0;
for(const r of rows){
  if(typeof r.name==='string' && englishHint.test(r.name)) names++;
  let abilities=r.abilities;
  if(typeof abilities==='string'){ try{abilities=JSON.parse(abilities);}catch{abilities=[];} }
  for(const a of (Array.isArray(abilities)?abilities:[])){
    if(typeof a?.description==='string' && englishHint.test(a.description)) descs++;
  }
}
console.log(JSON.stringify({rows:rows.length,englishNames:names,englishDescriptions:descs},null,2));
