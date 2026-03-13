# Vamos fazer a tela de batalhas, vincule ela nos torneios, nos desafios, no codex trials

# Essa tela vai ser feito em batalhas de 1x 3x ou 6x e 10x cartas, depende a variação escolhida. O layout deve se adaptar dinamicamente à quantidade de criaturas.

Disposição das Criaturas (Progressão Linear)

As criaturas devem ser exibidas no formato Progressão Linear:

Exemplo visual (3x3):

[ C1 ]
[ C1 ][ C2 ]
[ C1 ][ C2 ][ C3 ]

Sempre alinhadas da esquerda para a direita,
crescendo em quantidade conforme o formato da batalha.

# Cada batalha vencida dará uma quantidade variavel de xp dependendo a quantidade de criaturas derrotas e a variação da quantidade de cartas

# as cartas precisam ficar na tela em formato Progressão Linear 1 na ultima posição depois 2, depois 3...

# os contadores de mugic vai ter no máximo 6 slots para cada jogador colocar, cada criatura

# Sistema de Locations

Cada jogador deve possuir exatamente 10 Locations no deck

Nem mais nem menos

Apenas 1 Location ativa por vez

Quando uma criatura é derrotada → nova Location é revelada

O jogador pode visualizar seus 10 slots antes da partida

Durante o jogo, apenas a Location ativa fica visível

UI necessária:

Seletor de Locations (pré-batalha)

Indicador visual da Location ativa

Tooltip com descrição e efeitos

🎶 Sistema de Mugic

Cada jogador possui no máximo 6 Mugic no deck

Cada criatura possui contador próprio

O contador define quantas Mugics ela pode usar

UI necessária:

6 slots visuais por jogador

Ícones preenchidos conforme uso

Mugic só pode ser arrastado para criatura com slot disponível

🛡 Sistema de Battlegear

Cada criatura pode ter no máximo 1 Battlegear

Battlegear é equipado via drag and drop

Ao morrer, o Battlegear é descartado

UI:

Slot visual abaixo da criatura

Ícone pequeno indicando equipamento ativo

⚔ Sistema de Attack Cards

Cada jogador deve ter exatamente 20 Attack Cards

Nem mais nem menos

A cada combate:

Cada jogador seleciona 1 Attack

Revelação simultânea

Cálculo de dano

Regras de Ataque

Jogador escolhe criatura ativa

Seleciona carta de ataque

Confirma ação

Oponente seleciona sua carta

Sistema revela ambas

Dano é aplicado simultaneamente

Energia reduzida

Se energia = 0 → criatura derrotada

🔄 Sistema de Turnos

Turnos alternados

Um jogador por vez

O jogador pode:

Atacar

Usar Mugic

Equipar Battlegear

Passar turno

Botões obrigatórios:

[ Finalizar Turno ]

[ Atacar ]

[ Usar Mugic ]

[ Equipar ]

[ Cancelar Ação ]

Timer opcional para cada turno.

🖱 Interações Obrigatórias
Drag and Drop

O usuário deve poder:

Arrastar criaturas para posições

Arrastar Battlegear para criatura

Arrastar Mugic para criatura

Arrastar Attack para área de combate

Ao arrastar:

Destinos válidos devem destacar em verde

Destinos inválidos devem destacar em vermelho

🏆 Sistema de XP

XP deve ser variável com base em:

Quantidade de criaturas derrotadas

Formato da batalha

Dificuldade (torneio, desafio, casual)

🎨 Estados Visuais Necessários

Criatura ativa destacada

Criatura derrotada em escala de cinza

Mugic slot vazio / preenchido

Location ativa com efeito visual

Carta selecionada com glow

Barra de vida animada

🏁 Condição de Vitória

Todas as criaturas do oponente derrotadas

Sistema exibe:

Tela de vitória

XP ganho

Moedas recebidas

Atualização de missão

# exemplo de tabela

| Tipo       | No Deck | Ativos ao mesmo tempo |
| ---------- | ------- | --------------------- |
| Criaturas  | 3 ou 6, | 1 batalha por vez     |
| Locations  | 5       | 1 ativa               |
| Battlegear | até 6   | 1 por criatura        |
| Mugic      | até 6   | Limitado por contador |
| Attacks    | 20      | 1 por combate         |

# use useReducer para gerar os estados das batalhas
