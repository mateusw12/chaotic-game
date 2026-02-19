const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('src/components/data/aliances_attacks.json','utf8'));
for(const r of rows){
  console.log(`${r.id}|${r.name}`);
}
