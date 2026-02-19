const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('src/components/data/aliances_attacks.json','utf8'));
const set=new Set();
for(const r of rows){
  let abilities=r.abilities;
  if(typeof abilities==='string'){ try{abilities=JSON.parse(abilities);}catch{abilities=[];} }
  for(const a of (Array.isArray(abilities)?abilities:[])){
    if(typeof a?.description==='string' && a.description.trim()) set.add(a.description.trim());
  }
}
[...set].forEach((d,i)=>console.log(`${i+1}|${d}`));
console.log('TOTAL', set.size);
