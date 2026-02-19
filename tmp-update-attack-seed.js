const fs=require('fs');
const crypto=require('crypto');
const file='src/components/data/attack.json';
const rows=JSON.parse(fs.readFileSync(file,'utf8'));
let uuidReplaced=0;
let inferredFileName=0;

const inferFileName=(imageFileId)=>{
  if(typeof imageFileId!=='string') return null;
  const trimmed=imageFileId.trim();
  if(!trimmed) return null;
  const last=trimmed.split('/').pop() ?? '';
  const match=last.match(/-(\d+\.png)$/i);
  if(match) return match[1];
  if(/\.png$/i.test(last)) return last;
  return null;
};

for(const row of rows){
  row.id=crypto.randomUUID();
  uuidReplaced++;

  const currentFileName=typeof row.file_name==='string' ? row.file_name.trim() : '';
  if(!currentFileName){
    const inferred=inferFileName(row.image_file_id);
    if(inferred){
      row.file_name=inferred;
      inferredFileName++;
    }
  }
}

fs.writeFileSync(file, JSON.stringify(rows,null,4)+'\n','utf8');
console.log(JSON.stringify({rows:rows.length,uuidReplaced,inferredFileName},null,2));
