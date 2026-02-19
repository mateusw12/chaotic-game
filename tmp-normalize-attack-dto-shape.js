const fs = require('fs');
const crypto = require('crypto');

const filePath = 'src/components/data/attack.json';
const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const rarities = new Set(['comum','incomum','rara','super_rara','ultra_rara']);
const elements = new Set(['fire','water','air','earth']);
const validStats = new Set(['power','courage','speed','wisdom','mugic','energy']);

function normalizeRarity(value){
  if(typeof value !== 'string') return 'comum';
  const normalized = value.trim().toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll('á','a').replaceAll('â','a').replaceAll('ã','a')
    .replaceAll('é','e').replaceAll('ê','e')
    .replaceAll('í','i')
    .replaceAll('ó','o').replaceAll('ô','o').replaceAll('õ','o')
    .replaceAll('ú','u');
  if(normalized === 'super_raro') return 'super_rara';
  if(normalized === 'ultra_raro') return 'ultra_rara';
  return rarities.has(normalized) ? normalized : 'comum';
}

function parseJsonArray(value){
  if(Array.isArray(value)) return value;
  if(typeof value === 'string'){
    const trimmed = value.trim();
    if(!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function inferFileNameFromImageFileId(imageFileId){
  if(typeof imageFileId !== 'string') return null;
  const trimmed = imageFileId.trim();
  if(!trimmed) return null;
  const last = trimmed.split('/').pop() ?? '';
  const match = last.match(/(\d+\.png)$/i);
  return match ? match[1] : (/\.png$/i.test(last) ? last : null);
}

function normalizeElementValues(row){
  const parsed = parseJsonArray(row.element_values ?? row.elementValues);
  if(parsed.length){
    return parsed
      .map((item)=>({
        element: typeof item?.element === 'string' ? item.element.trim().toLowerCase() : '',
        value: Number(item?.value ?? 0),
      }))
      .filter((item)=>elements.has(item.element))
      .map((item)=>({ element: item.element, value: Number.isFinite(item.value) ? Math.max(0, Math.floor(item.value)) : 0 }));
  }

  const elementalDamage = row.elemental_damage;
  if(elementalDamage && typeof elementalDamage === 'object' && !Array.isArray(elementalDamage)){
    return Object.entries(elementalDamage)
      .map(([element, value]) => ({ element: String(element).trim().toLowerCase(), value: Number(value ?? 0) }))
      .filter((item)=>elements.has(item.element))
      .map((item)=>({ element: item.element, value: Number.isFinite(item.value) ? Math.max(0, Math.floor(item.value)) : 0 }));
  }

  return [];
}

function inferStat(description){
  const normalized = String(description || '').toLowerCase();
  if(normalized.includes('coragem') || normalized.includes('courage')) return 'courage';
  if(normalized.includes('poder') || normalized.includes('power')) return 'power';
  if(normalized.includes('velocidade') || normalized.includes('speed')) return 'speed';
  if(normalized.includes('sabedoria') || normalized.includes('wisdom')) return 'wisdom';
  if(normalized.includes('mugic')) return 'mugic';
  return 'energy';
}

function inferValue(description){
  const matches = String(description || '').match(/\d+/g);
  if(!matches?.length) return 0;
  const last = Number(matches[matches.length - 1]);
  return Number.isFinite(last) ? Math.max(0, last) : 0;
}

function normalizeTargetScope(raw){
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if(v === 'attacker') return 'attacker';
  if(v === 'defender') return 'defender';
  if(['opponent','opposing','opposing_creature','enemy','engaged_creatures','all_battlegear'].includes(v)) return 'defender';
  return 'attacker';
}

function normalizeEffectType(raw, description){
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if(value === 'increase' || value === 'gain') return 'increase';
  if(value === 'decrease' || value === 'damage' || value === 'protection') return 'decrease';
  if(value === 'special' || value === 'stat_modifier' || value === 'modification'){
    const text = String(description || '').toLowerCase();
    const decreaseHints = ['perde','remove','destrua','cause','dano','reduzido'];
    return decreaseHints.some((h)=>text.includes(h)) ? 'decrease' : 'increase';
  }
  return 'decrease';
}

function normalizeAbilities(value){
  const parsed = parseJsonArray(value);
  return parsed
    .map((ability)=>{
      const description = typeof ability?.description === 'string' ? ability.description.trim() : '';
      if(!description) return null;
      const conditionRaw = ability?.conditionElement ?? ability?.condition_element ?? ability?.battleRules?.payload?.condition_element ?? ability?.battleRules?.payload?.element;
      const conditionElement = typeof conditionRaw === 'string' ? conditionRaw.trim().toLowerCase() : undefined;
      const normalizedConditionElement = elements.has(conditionElement) ? conditionElement : undefined;
      const statRaw = typeof ability?.stat === 'string' ? ability.stat.trim().toLowerCase() : '';
      const stat = validStats.has(statRaw) ? statRaw : inferStat(description);
      const rawValue = Number(ability?.value ?? NaN);
      const valueNumber = Number.isFinite(rawValue) ? Math.max(0, Math.floor(rawValue)) : inferValue(description);

      return {
        description,
        conditionElement: normalizedConditionElement,
        targetScope: normalizeTargetScope(ability?.targetScope),
        effectType: normalizeEffectType(ability?.effectType, description),
        stat,
        value: valueNumber,
      };
    })
    .filter(Boolean);
}

let regeneratedIds = 0;
let normalizedRows = 0;

const normalized = rows.map((row)=>{
  const id = typeof row.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id)
    ? row.id
    : (regeneratedIds++, crypto.randomUUID());

  const imageFileId = typeof row.image_file_id === 'string' && row.image_file_id.trim() ? row.image_file_id.trim() : null;
  const normalizedRow = {
    id,
    file_name: (typeof row.file_name === 'string' && row.file_name.trim()) || inferFileNameFromImageFileId(imageFileId) || null,
    name: typeof row.name === 'string' ? row.name.trim() : '',
    rarity: normalizeRarity(row.rarity),
    image_file_id: imageFileId,
    image_url: row.image_url ?? null,
    energy_cost: Number.isFinite(Number(row.energy_cost ?? row.energyCost ?? row.build_cost ?? 0))
      ? Math.max(0, Math.floor(Number(row.energy_cost ?? row.energyCost ?? row.build_cost ?? 0)))
      : 0,
    element_values: normalizeElementValues(row),
    abilities: normalizeAbilities(row.abilities),
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };

  normalizedRows++;
  return normalizedRow;
}).filter((row)=>row.name);

fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 4)}\n`, 'utf8');
console.log(JSON.stringify({rowsIn: rows.length, rowsOut: normalized.length, normalizedRows, regeneratedIds}, null, 2));
