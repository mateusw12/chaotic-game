const fs = require('fs');
const rows = JSON.parse(fs.readFileSync('src/components/data/battlegear.json', 'utf8'));
const counts = new Map();
for (const row of rows) {
  counts.set(row.name, (counts.get(row.name) || 0) + 1);
}
const lines = [...counts.entries()]
  .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
  .map(([name, count]) => `${count}x ${name}`);
console.log(lines.join('\n'));
