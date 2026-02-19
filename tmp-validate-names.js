const fs = require('fs');
const file = 'src/components/data/battlegear.json';
const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
const counts = new Map();
for (const row of rows) counts.set(row.name, (counts.get(row.name) || 0) + 1);
console.log(JSON.stringify({ totalCards: rows.length, uniqueNames: counts.size }, null, 2));
console.log('\nNOMES:');
console.log([...counts.entries()].sort((a,b)=>a[0].localeCompare(b[0], 'pt-BR')).map(([n,c])=>`${c}x ${n}`).join('\n'));
