import { LeagueSpec, BattleFormat } from "./codex-trials-view.interface";

export const LEAGUES: LeagueSpec[] = [
  {
    id: 1,
    tier: "Liga 1 · Bronze",
    name: "Rising Sparks",
    boss: "Ignitus",
    objective: "Consolidar fundamentos e leitura de jogo.",
    rewardFocus: "Cartas básicas + moedas.",
    rewardHighlights: ["Pacote base", "Moedas bônus", "Carta de progressão"],
    imgSymbol: "bronze.png",
    imgBoss: "boss_1.png"
  },
  {
    id: 2,
    tier: "Liga 2 · Prata",
    name: "Shadow Trials",
    boss: "Umbraxis",
    objective: "Evoluir consistência tática e gestão de recursos.",
    rewardFocus: "Cartas incomuns + diamantes menores.",
    rewardHighlights: ["Cartas incomuns", "Diamantes", "Bônus de etapa"],
    imgSymbol: "silver.png",
    imgBoss: "boss_2.png"
  },
  {
    id: 3,
    tier: "Liga 3 · Ouro",
    name: "Elemental Apex",
    boss: "Maelstryx",
    objective: "Forçar adaptação estratégica entre elementos e ritmos.",
    rewardFocus: "Cartas raras e progressão estratégica.",
    rewardHighlights: ["Cartas raras", "XP elevado", "Recompensa de consistência"],
    imgSymbol: "gold.png",
    imgBoss: "boss_3.png"
  },
  {
    id: 4,
    tier: "Liga 4 · Platina",
    name: "Crystal Dominion",
    boss: "Cryovex",
    objective: "Dominar partidas com restrições avançadas.",
    rewardFocus: "Raras + ultra raras situacionais.",
    rewardHighlights: ["Raras avançadas", "Chance ultra rara", "Bônus tático"],
    imgSymbol: "platinum.png",
    imgBoss: "boss_4.png"
  },
  {
    id: 5,
    tier: "Liga 5 · Diamante",
    name: "Titan Arena",
    boss: "Titanor",
    objective: "Operar combos sob alta pressão de tempo e recursos.",
    rewardFocus: "Pacotes premium e cartas raras.",
    rewardHighlights: ["Pacote premium", "Cartas raras", "Bônus de elite"],
    imgSymbol: "diamond.png",
    imgBoss: "boss_5.png"
  },
  {
    id: 6,
    tier: "Liga 6 · Campeão",
    name: "Chaos Citadel",
    boss: "Codarion",
    objective: "Atingir consistência de performance em cenários limite.",
    rewardFocus: "Recompensas altas e exclusivas por modo.",
    rewardHighlights: ["Recompensa exclusiva", "Super/ultra raras", "Multiplicador de bônus"],
    imgSymbol: "champion.png",
    imgBoss: "boss_6.png"
  },
  {
    id: 7,
    tier: "Liga 7 · Lendária",
    name: "Pantheon of Champions",
    boss: "Apexion",
    objective: "Concluir a jornada competitiva máxima do modo.",
    rewardFocus: "Ultra raras/promo e bônus máximos.",
    rewardHighlights: ["Carta promo", "Ultra rara garantida", "Bônus máximo"],
    imgSymbol: "legend.png",
    imgBoss: "boss_7.png"
  },
];

export const FORMAT_OPTIONS: Array<{ value: BattleFormat; label: string; description: string }> = [
  { value: "1x1", label: "Formato 1x1", description: "Partidas rápidas com foco em leitura tática." },
  { value: "3x3", label: "Formato 3x3", description: "Combinações intermediárias e sinergia de tribos." },
  { value: "5x5", label: "Formato 5x5", description: "Estratégias amplas com mais variações de turno." },
  { value: "7x7", label: "Formato 7x7", description: "Modo avançado com alto nível de complexidade." },
];
