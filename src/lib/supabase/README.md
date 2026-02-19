# Estrutura da Biblioteca Supabase

Esta biblioteca foi reorganizada para melhor organização e manutenção do código.

## Estrutura de Pastas

```
supabase/
├── core/                    # Utilitários compartilhados
│   ├── types.ts            # Tipos de erro do Supabase
│   ├── table-names.ts      # Funções para obter nomes de tabelas
│   ├── validators.ts       # Funções de validação compartilhadas
│   └── index.ts            # Exports do core
│
├── storage/                 # Gerenciamento de storage
│   ├── client.ts           # Cliente Supabase e utilitários
│   ├── buckets.ts          # Configuração de buckets
│   ├── public-urls.ts      # Funções para URLs públicas
│   ├── uploads.ts          # Funções de upload
│   └── index.ts            # Exports do storage
│
├── users/                   # Contexto de usuários
│   ├── types.ts            # Tipos específicos de usuários
│   └── index.ts            # API e exports
│
├── wallets/                 # Contexto de carteiras
│   ├── types.ts            # Tipos específicos de carteiras
│   └── index.ts            # API e exports
│
├── abilities/               # Contexto de habilidades
│   ├── types.ts            # Tipos específicos de habilidades
│   └── index.ts            # API e exports
│
├── creatures/               # Contexto de criaturas
│   ├── types.ts            # Tipos específicos de criaturas
│   └── index.ts            # API e exports
│
├── locations/               # Contexto de locações
│   ├── types.ts            # Tipos específicos de locações
│   └── index.ts            # API e exports
│
├── battlegear/              # Contexto de equipamentos
│   ├── types.ts            # Tipos específicos de equipamentos
│   └── index.ts            # API e exports
│
├── mugic/                   # Contexto de mugic
│   ├── types.ts            # Tipos específicos de mugic
│   └── index.ts            # API e exports
│
├── attacks/                 # Contexto de ataques
│   ├── types.ts            # Tipos específicos de ataques
│   └── index.ts            # API e exports
│
├── progression/             # Contexto de progressão
│   ├── types.ts            # Tipos específicos de progressão
│   └── index.ts            # API e exports
│
├── decks/                   # Contexto de decks
│   ├── types.ts            # Tipos específicos de decks
│   └── index.ts            # API e exports
│
├── tournaments/             # Contexto de torneios
│   ├── types.ts            # Tipos específicos de torneios
│   └── index.ts            # API e exports
│
├── store/                   # Contexto de loja
│   ├── types.ts            # Tipos específicos de loja
│   └── index.ts            # API e exports
│
└── index.ts                 # Export principal da biblioteca

```

## Como Usar

### Importar de um contexto específico

```typescript
// Importar tipos e funções de um contexto específico
import { UsersApi, type SupabaseUserRow } from "@/lib/supabase/users";
import { type SupabaseCreatureRow } from "@/lib/supabase/creatures";
```

### Importar do módulo principal

```typescript
// Importar do módulo principal (recomendado)
import { UsersApi, type SupabaseUserRow } from "@/lib/supabase";
```

### Usar utilitários compartilhados

```typescript
// Core utilities
import { getUsersTableName, isMissingTableError } from "@/lib/supabase/core";

// Storage utilities
import {
  getSupabaseAdminClient,
  uploadCreatureImageToStorage,
} from "@/lib/supabase/storage";
```

## Padrões de Organização

### Cada contexto contém:

1. **types.ts** - Interfaces e tipos específicos do contexto
   - Tipos de linhas do Supabase (SupabaseXxxRow)
   - Tipos auxiliares específicos

2. **index.ts** - Exports públicos do contexto
   - Exporta todos os tipos
   - Exporta funções de API (quando implementadas)
   - Mantém compatibilidade com código legado

### Módulos compartilhados:

- **core/** - Validadores, utilitários e tipos compartilhados
- **storage/** - Gerenciamento de storage e uploads

## Migração de Código Legado

O código existente continua funcionando graças aos exports de compatibilidade:

```typescript
// Código antigo (ainda funciona)
import { getUserByEmail } from "@/lib/supabase";

// Código novo (recomendado no futuro)
import { UsersApi } from "@/lib/supabase/users";
await UsersApi.getUserByEmail(email);
```

## Próximos Passos

Para completar a reorganização, considere:

1. Mover a lógica de funções dos arquivos raiz para classes API dentro de cada contexto
2. Criar arquivos `api.ts` com classes estáticas para cada contexto
3. Gradualmente atualizar o código para usar as novas APIs organizadas
4. Remover arquivos legados quando não houver mais dependências

## Benefícios

- ✅ Melhor organização por contexto
- ✅ Tipos isolados e mais fáceis de encontrar
- ✅ Redução de acoplamento
- ✅ Facilita testes unitários
- ✅ Escalabilidade melhorada
- ✅ Compatibilidade retroativa mantida
