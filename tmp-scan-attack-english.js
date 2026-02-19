const fs=require('fs');
for (const f of ['src/components/data/attack.json','src/components/data/aliances_attacks.json']){
  const rows=JSON.parse(fs.readFileSync(f,'utf8'));
  const re=/(\bthe\b|\btarget\b|\bcreature\b|\battack\b|\bdamage\b|\bgain\b|\blose\b|\bif\b|\bdeal\b|\bchallenge\b|\bfire\b|\bwater\b|\bair\b|\bearth\b)/i;
  let names=0, desc=0;
  for(const r of rows){
    if(typeof r.name==='string' && re.test(r.name)) names++;
    let abilities=r.abilities;
    if(typeof abilities==='string'){ try{abilities=JSON.parse(abilities);}catch{abilities=[];} }
    for(const a of (Array.isArray(abilities)?abilities:[])) if(typeof a?.description==='string' && re.test(a.description)) desc++;
  }
  console.log(JSON.stringify({file:f,rows:rows.length,englishNames:names,englishDescriptions:desc},null,2));
}
