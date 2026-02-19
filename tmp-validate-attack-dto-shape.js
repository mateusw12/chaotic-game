const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('src/components/data/attack.json','utf8'));
const uuidV=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedRarity=new Set(['comum','incomum','rara','super_rara','ultra_rara']);
const allowedElement=new Set(['fire','water','air','earth']);
const allowedScope=new Set(['attacker','defender']);
const allowedEffect=new Set(['increase','decrease']);
const allowedStat=new Set(['power','courage','speed','wisdom','mugic','energy']);
let badId=0,badRarity=0,badElementValues=0,badAbilities=0,stringArrays=0;
const abilityShapes=new Set();
for(const row of rows){
  if(!uuidV.test(String(row.id||''))) badId++;
  if(!allowedRarity.has(String(row.rarity||''))) badRarity++;
  if(typeof row.element_values==='string' || typeof row.abilities==='string') stringArrays++;
  if(!Array.isArray(row.element_values)) badElementValues++;
  else {
    for(const e of row.element_values){ if(!allowedElement.has(String(e?.element||'')) || typeof e?.value !== 'number') badElementValues++; }
  }
  if(!Array.isArray(row.abilities)) badAbilities++;
  else {
    for(const a of row.abilities){
      abilityShapes.add(Object.keys(a||{}).sort().join('|'));
      if(typeof a?.description!=='string') badAbilities++;
      if(a?.conditionElement != null && !allowedElement.has(String(a.conditionElement))) badAbilities++;
      if(!allowedScope.has(String(a?.targetScope||''))) badAbilities++;
      if(!allowedEffect.has(String(a?.effectType||''))) badAbilities++;
      if(!allowedStat.has(String(a?.stat||''))) badAbilities++;
      if(typeof a?.value !== 'number') badAbilities++;
    }
  }
}
console.log(JSON.stringify({rows:rows.length,badId,badRarity,badElementValues,badAbilities,stringArrays,abilityShapes:[...abilityShapes]},null,2));
