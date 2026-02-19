const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('src/components/data/aliances_attacks.json','utf8'));
const englishHint=/(\bthe\b|\btarget\b|\bcreature\b|\battack\b|\bdamage\b|\bgain\b|\blose\b|\bif\b|\bdeal\b|\bchallenge\b|\bfire\b|\bwater\b|\bair\b|\bearth\b|\bdraw\b|\bdiscard\b|\blook\b)/i;
let names=0,desc=0;
for(const r of rows){
  if(typeof r.name==='string' && englishHint.test(r.name)) { names++; console.log('NAME', r.name); }
  let abilities=r.abilities;
  if(typeof abilities==='string'){ try{abilities=JSON.parse(abilities);}catch{abilities=[];} }
  for(const a of (Array.isArray(abilities)?abilities:[])){
    if(typeof a?.description==='string' && englishHint.test(a.description)) { desc++; console.log('DESC', a.description); }
  }
}
console.log(JSON.stringify({rows:rows.length,englishNames:names,englishDescriptions:desc},null,2));
