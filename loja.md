vamos criar uma loja de cards onde todos tem acesso, pode ser no menu lateral também, iremos ter outros icones mais tarde.

# nessa loja, terá pacotes a venda para ser comprado com moedas ou diamantes

1️⃣ Estrutura básica da loja
Seções principais

Pacotes de cartas

Comuns, Incomuns etc...

Mostrar quantos cards vêm por pacote, possíveis bônus de elemento ou facção, raridade média

Ex: Pacote “Starter” (10 cartas, 1 rara garantida)

Cartas Individuais / Promoções

Cartas especiais ou promo limitadas

Pode ter um contador regressivo ou estoque limitado pra dar sensação de exclusividade

Moedas e Diamantes

Moedas → mais fáceis de conseguir, podem comprar pacotes básicos

Diamantes → raros, usados para pacotes especiais, cartas promo ou ultra raras

Ofertas Especiais / Rotativas

“Pacote do Dia”, “Carta Rara Garantida”

Incentiva o jogador a voltar diariamente

2️⃣ Sistema de compra inspirado em FIFA/EA FC

Pacote aleatório (loot box): jogador compra pacote → cartas aparecem uma a uma com animação de revelação (tipo efeito de suspense da FIFA)

Moedas x Diamantes

Pacotes de moedas → padrão, chances normais de cartas raras

Pacotes de diamantes → maior chance de ultra raras, cartas exclusivas ou promo

Sistema de pacotes garantidos

Ex: “1 carta rara garantida a cada pacote de 5 cartas”

Isso evita frustração do jogador e aumenta percepção de valor

Poderia ter pacote somente criaturas, somennte mujic e ataques, e somente locais, ou tudo misto

pacotes por região, outro munddo, danian, mipeadean

precisaria colocar o percentual de chances de vir cada carta e as garantidas, e poderiam vir cartas repetidas não no mesmo pacote mas em pacotes diferentes, ai avisar o usuário que ele tem carta repetida que ele pode descartar ou manter no deck

as cartas pegariam das nossas cadsatradas

e ja com a loja prepare o terreno porque cada jogdaor terá um deck com todas as cartas e ele pode criar decks a partir desse deck de todas as cartas que ele tem

## Estoque limitado (diário e semanal)

Para evitar que o usuário compre tudo de uma vez, a loja deve ter limite de compra por usuário.

- Alguns pacotes com limite diário
- Alguns pacotes com limite semanal
- Reset em UTC para manter regra única no backend

### Regras sugeridas

- Pacotes básicos (moedas): limite **diário**
- Pacotes especiais (diamantes): limite **semanal**
- Promoções específicas: podem ter limite diário + semanal ao mesmo tempo

### Exemplo de limites por pacote

- `starter_moedas`: até **2 por dia**
- `misto_regiao`: até **1 por dia**
- `somente_locais`: até **3 por semana**
- `rara_garantida_diamantes`: até **2 por semana**

### Controle técnico (backend)

- O backend valida limite antes de finalizar a compra
- Se passou do limite, retorna erro amigável de limite atingido
- Registrar compra em histórico para contar consumo por janela (dia/semana)

### UX

- Mostrar no card do pacote: `Restam X hoje` ou `Restam X na semana`
- Quando zerar, botão de compra fica desabilitado
