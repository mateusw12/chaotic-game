const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('src/components/data/attack.json','utf8'));
const uuidV4=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let badIds=0;
for(const row of rows){ if(!uuidV4.test(String(row.id??''))) badIds++; }
console.log(JSON.stringify({rows:rows.length,badIds,withFileName:rows.filter(r=>typeof r.file_name==='string'&&r.file_name.trim()).length},null,2));
