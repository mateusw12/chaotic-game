const fs=require('fs');
const file='src/components/data/aliances_attacks.json';
const rows=JSON.parse(fs.readFileSync(file,'utf8'));

const nameMap=new Map([
['Atmosphere','Atmosfera'],
['Before the Storm','Antes da Tempestade'],
['Clean Slide','Deslize Limpo'],
['Combustion Carnage','Carnificina da Combustão'],
['Consuming Flame','Chama Consumidora'],
['Deadwater Devastation','Devastação das Águas Mortas'],
['Dry Touch','Toque Seco'],
['Dust Strike','Golpe de Poeira'],
['Earth Pulse','Pulso da Terra'],
['Earthshape','Forma da Terra'],
['Eidolon Advance','Avanço Eidolon'],
['Broding Blast','Explosão de Broding'],
['Essential Evaporation','Evaporação Essencial'],
['Extinguishing Fountain','Fonte Extintora'],
['Flame Breach','Ruptura Flamejante'],
['Flame Fright','Pavor Flamejante'],
['Flood Force','Força da Inundação'],
['Fluid Flame','Chama Fluida'],
["Gladiator's Fire",'Fogo do Gladiador'],
['Grounding Grapple','Agarre de Aterramento'],
['Incessant Wave','Onda Incessante'],
['Inferno Claws','Garras Infernais'],
['Magma Might','Poder do Magma'],
['Meditative Leap','Salto Meditativo'],
['Mind Mash','Esmagamento Mental'],
['Mindvoid','Vazio Mental'],
['Mineral Mayhem','Caos Mineral'],
['Obscuring Winds','Ventos Ofuscantes'],
['Outfreeze','Supercongelamento'],
['Paraseed','Parasemente'],
['Primordial Rage','Fúria Primordial'],
['Hainspears','Lanças de Granizo'],
['Retallatory Strike','Golpe Retaliatório'],
['Sleet Slide','Deslize de Granizo'],
['Smokesurge','Surto de Fumaça'],
['Sudden Flare','Clarão Repentino'],
['Synaptic Acceleration','Aceleração Sináptica'],
['Teotosthike','Golpe Teotosthike'],
['Terrantula Tackle','Investida Terrântula'],
["Traditionalist's Charge",'Carga Tradicionalista'],
['Turbulence Funnel','Funil de Turbulência'],
['Vacuum Hemisphere','Hemisfério de Vácuo'],
['Vapor Wipeout','Aniquilação de Vapor'],
['Voltdrive','Impulso Voltaico'],
['Wall of Flame','Parede de Chamas'],
['Xenocentric Wrath','Ira Xenocêntrica'],
]);

const descMap=new Map([
['If your engaged Creature has Invisibility, deal 5 damage.','Se sua Criatura engajada tiver Invisibilidade, cause 5 de dano.'],
['Air: This counts as your first attack.','Ar: Este ataque conta como seu primeiro ataque.'],
['If the opposing engaged Creature has Earth, damage dealt by Clean Slide is reduced to 0.','Se a Criatura engajada oponente tiver Terra, o dano causado por Deslize Limpo é reduzido a 0.'],
['Fire: You may sacrifice an unengaged Creature you control. If you do, deal 20 damage.','Fogo: Você pode sacrificar uma Criatura desengajada que controla. Se fizer isso, cause 20 de dano.'],
['Fire: The opposing engaged Creature loses Water.','Fogo: A Criatura engajada oponente perde Água.'],
['Stat Check Speed 60: Deal 5 damage.','Teste de Atributo Velocidade 60: Cause 5 de dano.'],
['Your engaged Creature gains Earth until the end of combat.','Sua Criatura engajada ganha Terra até o fim do combate.'],
['Deal 5 damage if your engaged Creature has one or more Mugic counters.','Cause 5 de dano se sua Criatura engajada tiver um ou mais contadores de Mugic.'],
['Air: The opposing engaged Creature loses Earth.','Ar: A Criatura engajada oponente perde Terra.'],
['The opposing engaged Creature loses Fire.','A Criatura engajada oponente perde Fogo.'],
['Stat Check Power 60: Deal 10 damage.','Teste de Atributo Poder 60: Cause 10 de dano.'],
['Engaged Creatures with less than 50 Wisdom or Courage lose a Mugic counter.','Criaturas engajadas com menos de 50 de Sabedoria ou Coragem perdem um contador de Mugic.'],
['If your engaged Creature has Recklessness, deal 5 damage.','Se sua Criatura engajada tiver Recklessness, cause 5 de dano.'],
['Earth: Look at the top three cards of your Location Deck and put them back in any order. You may reveal a new active Location.','Terra: Olhe as três cartas do topo do seu Deck de Local e coloque-as de volta em qualquer ordem. Você pode revelar um novo Local ativo.'],
['Stat Check Courage 60: Deal 5 damage.','Teste de Atributo Coragem 60: Cause 5 de dano.'],
["Fire: Destroy the opposing engaged Creature's Battlegear.",'Fogo: Destrua o Battlegear da Criatura engajada oponente.'],
['Stat Check Wisdom 100: Remove a Mugic counter from a Creature you control. If you do, put a Mugic counter on your engaged Creature.','Teste de Atributo Sabedoria 100: Remova um contador de Mugic de uma Criatura que você controla. Se fizer isso, coloque um contador de Mugic na sua Criatura engajada.'],
['Stat Check Speed 100: Draw an Attack Card and discard an Attack Card.','Teste de Atributo Velocidade 100: Compre uma carta de Ataque e descarte uma carta de Ataque.'],
['Challenge Wisdom vs Courage: Deal 15 damage.','Desafio Sabedoria vs Coragem: Cause 15 de dano.'],
['Challenge Wisdom vs Power: Deal 15 damage.','Desafio Sabedoria vs Poder: Cause 15 de dano.'],
['Challenge Wisdom vs Speed: Deal 15 damage.','Desafio Sabedoria vs Velocidade: Cause 15 de dano.'],
['Stat Check Courage 100: Gain 5 Energy.','Teste de Atributo Coragem 100: Ganhe 5 de Energia.'],
['You may choose to have Mineral Mayhem deal no damage. If you do, gain 100 Courage.','Você pode escolher que Caos Mineral não cause dano. Se fizer isso, ganhe 100 de Coragem.'],
['You may choose to have Obscuring Winds deal no damage. If you do, gain 100 Speed.','Você pode escolher que Ventos Ofuscantes não cause dano. Se fizer isso, ganhe 100 de Velocidade.'],
['You may choose to have Outfreeze deal no damage. If you do, gain 100 Wisdom.','Você pode escolher que Supercongelamento não cause dano. Se fizer isso, ganhe 100 de Sabedoria.'],
['Deal 5 damage if Hive is active.','Cause 5 de dano se Hive estiver ativo.'],
['You may choose to have Primordial Rage deal no damage. If you do, gain 100 Power.','Você pode escolher que Fúria Primordial não cause dano. Se fizer isso, ganhe 100 de Poder.'],
['Stat Check Wisdom 60: Deal 10 damage.','Teste de Atributo Sabedoria 60: Cause 10 de dano.'],
['Retallatory Strike deals additional damage equal to the damage dealt by the last attack played this combat.','Golpe Retaliatório causa dano adicional igual ao dano causado pelo último ataque jogado neste combate.'],
['If the opposing engaged Creature has Water, damage dealt by Sleet Slide is reduced to 0.','Se a Criatura engajada oponente tiver Água, o dano causado por Deslize de Granizo é reduzido a 0.'],
['If the opposing engaged Creature has Fire, damage dealt by Smokesurge is reduced to 0.','Se a Criatura engajada oponente tiver Fogo, o dano causado por Surto de Fumaça é reduzido a 0.'],
['Stat Check Wisdom 60: Deal 5 damage.','Teste de Atributo Sabedoria 60: Cause 5 de dano.'],
['Stat Check Power 100: Deal 5 damage.','Teste de Atributo Poder 100: Cause 5 de dano.'],
['Stat Check Courage 60: Deal 10 damage.','Teste de Atributo Coragem 60: Cause 10 de dano.'],
['Destroy all Battlegear equipped to engaged Creatures with less than 50 Power or Speed.','Destrua todos os Battlegears equipados em Criaturas engajadas com menos de 50 de Poder ou Velocidade.'],
['Stat Check Speed 60: Deal 10 damage.','Teste de Atributo Velocidade 60: Cause 10 de dano.'],
['The opposing engaged Creature loses Air.','A Criatura engajada oponente perde Ar.'],
['The opposing engaged Creature loses Water.','A Criatura engajada oponente perde Água.'],
['Your engaged Creature gains Air until the end of combat.','Sua Criatura engajada ganha Ar até o fim do combate.'],
['Air: Flip one Battlegear face-up and one Battlegear face-down.','Ar: Vire um Battlegear para cima e um Battlegear para baixo.'],
['Deal 10 damage if the opposing engaged Creature does not share a Tribe with the Creature playing this attack.','Cause 10 de dano se a Criatura engajada oponente não compartilhar uma Tribo com a Criatura que está jogando este ataque.']
]);

let namesChanged=0;
let descriptionsChanged=0;

for(const row of rows){
  if(typeof row.name==='string' && nameMap.has(row.name)){
    row.name=nameMap.get(row.name);
    namesChanged++;
  }

  let abilities=row.abilities;
  if(typeof abilities==='string'){
    try{ abilities=JSON.parse(abilities); }catch{ abilities=[]; }
  }

  if(Array.isArray(abilities)){
    for(const ability of abilities){
      if(typeof ability?.description==='string' && descMap.has(ability.description)){
        ability.description=descMap.get(ability.description);
        descriptionsChanged++;
      }
    }
  }

  row.abilities = JSON.stringify(Array.isArray(abilities)?abilities:[]);
}

fs.writeFileSync(file, JSON.stringify(rows,null,2)+'\n','utf8');
console.log(JSON.stringify({rows:rows.length,namesChanged,descriptionsChanged},null,2));
