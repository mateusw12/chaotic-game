# Sistema de Progressão

Este documento descreve como a progressão foi implementada atualmente no projeto.

## Visão geral

A progressão agora é baseada em:

- XP total por usuário
- Nível calculado a partir do XP
- XP atual dentro do nível
- XP necessário para o próximo nível
- Eventos de progressão (histórico/auditoria)
- Coleção de cartas por usuário, com suporte a cartas repetidas (`quantity`)
- Conversão de cartas repetidas em moedas (descarte)

Também foi integrado ao dashboard para exibir nível e barra de XP.

---

## Modelo de dados (Supabase)

### 1) `user_progression`

Armazena o estado agregado de progressão do jogador.

Campos principais:

- `user_id` (único por usuário)
- `xp_total`
- `level`
- `xp_current_level`
- `xp_next_level`
- `season_rank`

### 2) `user_cards`

Inventário de cartas do usuário com suporte a duplicatas.

Campos principais:

- `user_id`
- `card_type` (`creature`, `location`, `mugic`, `battlegear`, `attack`)
- `card_id`
- `rarity`
- `quantity`

Constraint importante:

- `unique (user_id, card_type, card_id)`

Ou seja, a duplicata aumenta `quantity` em vez de criar linha nova.

### 3) `progression_events`

Ledger de eventos que alteram progressão/economia.

Campos principais:

- `user_id`
- `source` (`battle_victory`, `card_awarded`, `card_discarded`)
- `xp_delta`
- `coins_delta`
- `diamonds_delta`
- `card_type`, `card_id`, `card_rarity` (quando aplicável)
- `quantity`
- `reference_id`
- `metadata` (jsonb)
- `created_at`

---

## Regras atuais

## Curva de nível

XP necessário para avançar do nível atual:

`xp_next_level = 100 + 25 * (level - 1)`

Exemplos:

- Nível 1 -> 2: 100 XP
- Nível 2 -> 3: 125 XP
- Nível 3 -> 4: 150 XP

## XP por vitória

- Vitória em batalha: **50 XP**

## XP por carta recebida (por unidade)

- `comum`: **8 XP**
- `incomum`: **16 XP**
- `rara`: **28 XP**
- `super_rara`: **45 XP**
- `ultra_rara`: **70 XP**

## Moedas por descarte (por unidade)

- `comum`: **20 moedas**
- `incomum`: **45 moedas**
- `rara`: **90 moedas**
- `super_rara`: **170 moedas**
- `ultra_rara`: **300 moedas**

---

## APIs implementadas

## Usuário autenticado

### `GET /api/progression/overview`

Retorna:

- progressão atual
- inventário de cartas
- eventos recentes
- moedas/diamantes

### `POST /api/progression/battle-victory`

Registra vitória e aplica XP.

Body opcional:

```json
{
  "referenceId": "battle-123"
}
```

### `POST /api/progression/cards/discard`

Descarta cartas da coleção e converte em moedas.

Body:

```json
{
  "userCardId": "uuid-da-carta-no-inventario",
  "quantity": 1
}
```

## Admin

### `POST /api/admin/progression/cards/award`

Concede carta para usuário, incrementa coleção e aplica XP por raridade.

Body:

```json
{
  "userId": "uuid-do-usuario",
  "cardType": "creature",
  "cardId": "uuid-da-carta-base",
  "rarity": "rara",
  "quantity": 1,
  "referenceId": "reward-xyz"
}
```

---

## Integração na Home

A home passa a exibir:

- Nível atual
- XP total
- XP do nível atual (`xpCurrentLevel/xpNextLevel`)
- Barra de progresso de XP

---

## Comportamento de criação automática

No login (`NextAuth events.signIn`):

- garante usuário no Supabase
- garante carteira
- garante registro de progressão

---

## Arquivos principais

- `src/dto/progression/progression.dto.ts`
- `src/lib/supabase/progression.ts`
- `src/app/api/progression/overview/route.ts`
- `src/app/api/progression/battle-victory/route.ts`
- `src/app/api/progression/cards/discard/route.ts`
- `src/app/api/admin/progression/cards/award/route.ts`
- `supabase/schema.sql`
- `src/components/home/home-view.tsx`
- `src/lib/supabase/wallets.ts`

---

## Próximos passos recomendados

1. Tornar a aplicação de evento transacional via RPC/SQL function para evitar inconsistência parcial (progressão atualizada e evento falhar, por exemplo).
2. Criar endpoint de simulação de recompensa (preview) para UI de baú/recompensa.
3. Adicionar filtros/paginação para eventos de progressão.
4. Implementar rank sazonal real baseado em MMR/ELO quando o sistema de batalha estiver completo.
5. Criar telas de inventário e descarte no frontend.
