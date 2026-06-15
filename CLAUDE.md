# CLAUDE.md — Projeto Custo de Produção Soja 2026

> Arquivo de contexto para o Claude Code. Descreve o objetivo, a stack, o modelo
> de dados e — o mais importante — as **fórmulas de cálculo já validadas** contra
> a planilha revisada `CUSTO_SOJA_2026_CORRIGIDA.xlsx`. Não reinventar a lógica
> de cálculo: ela bate célula a célula com a planilha e deve ser preservada.
>
> **Versão da lógica:** CORRIGIDA (barter com juros compostos + arrendamento
> sobre preço disponível). Esta é a versão de referência — ignore qualquer
> descrição anterior do barter.

---

## 1. O que é

Aplicação web interna da **Terrena Agronegócios** para simular custos e
rentabilidade da produção de soja por hectare. Substitui uma planilha Excel
(`CUSTO_SOJA_2026_CORRIGIDA.xlsx`) por um app multiusuário com:

- Parâmetros editáveis de simulação (produtividade, preços, barter, arrendamento)
- Condições do barter (taxa mensal, data de hoje, data de travamento)
- Duas configurações de insumos (Baixo Custo / Alta Produtividade), editáveis
- Custos operacionais editáveis
- Cálculo em tempo real (receita, investimento, custo do barter, arrendamento,
  custo total, lucro, margem, ponto de equilíbrio, custo/saca)
- Cenários salvos por safra
- Gráficos (composição de custo por família, sensibilidade à produtividade)

Já existe um **protótipo React single-file** na raiz do projeto:
`CustoSoja.jsx`. Ele contém a UI completa e o módulo de cálculo **já com a lógica
corrigida**, além das listas de insumos iniciais. O trabalho do Claude Code é
portar isso para um projeto Next.js full-stack com persistência real em Postgres,
mantendo a lógica idêntica. **A função `calcular` e o helper `mesesEntre` do
`CustoSoja.jsx` são a fonte da verdade.**

## 2. Público e ambiente

- Uso interno, equipe Terrena (poucos usuários).
- Web. Sem necessidade de app mobile no MVP.
- Login via Microsoft 365 (a equipe já usa contas corporativas M365).

## 3. Stack alvo

| Camada     | Escolha                                              |
|------------|------------------------------------------------------|
| Framework  | Next.js (App Router) + TypeScript                    |
| UI         | React + TailwindCSS + Recharts (gráficos)            |
| Banco      | PostgreSQL                                           |
| ORM        | Prisma                                               |
| Auth       | Auth.js (NextAuth) com provider Microsoft Entra ID   |
| Deploy     | Docker (servidor interno) ou Vercel + Neon no início |

**Princípio central:** a lógica de cálculo deve ser um **módulo puro de funções
TypeScript** (`lib/calc.ts`), isolado da UI e do banco, com testes unitários.
As fórmulas são encadeadas; se espalhadas pela UI, qualquer mudança vira bug
silencioso.

## 4. Modelo de dados (Prisma)

Esboço a refinar. Entidades principais:

- **Familia** — categoria de insumo (FUNGICIDA, INSETICIDA, BIOLÓGICO, FOLIAR,
  HERBICIDA, FERTILIZANTE, SEMENTE, OLEO MINERAL, ADJUVANTE, FRETE).
- **Insumo** — produto, quantidade, valor unitário (R$), familia, e a qual
  configuração pertence (BAIXO_CUSTO | ALTA_PRODUTIVIDADE).
- **CustoOperacional** — plantio, colheita, manutenção, outros; por configuração.
- **Safra** — ano/identificação (ex.: "Soja 2026"), agrupa cenários.
- **Cenario** — snapshot de parâmetros + resultados calculados, pertence a uma
  Safra e a um User.
- **User** — autenticação M365 (gerenciado pelo Auth.js).

Sugestão de enum:
```prisma
enum Configuracao { BAIXO_CUSTO ALTA_PRODUTIVIDADE }
```

O `Cenario` deve guardar os **parâmetros de entrada** (incluindo os do barter) e
um **resumo dos resultados** (para listar sem recalcular). Campos do barter no
Cenario:
```prisma
taxaMensal      Float    @default(0.016)   // 1,6% a.m.
dataHoje        DateTime?
dataTravamento  DateTime?
area            Float    @default(1)       // hectares de plantio
```

O formato do objeto de cenário usado no protótipo é:
```ts
{
  id, nome, ts,
  params: {
    produtividade, precoDisp, precoFuturo, barter, arrendamento,
    taxaMensal, dataHoje, dataTravamento, area
  },
  resumo: {
    investimentoTotal, receita, lucroOperacional, margem,
    pontoEquilibrio, custoPorSaca, precoSaca, usaAlta, custoBarter,
    lucroTotalFazenda, area
  }
}
```

## 5. FÓRMULAS DE CÁLCULO (versão CORRIGIDA — não alterar a lógica)

Replicam fielmente as abas `PRODUÇÃO SOJA` e `Planilha3` da planilha revisada.
Conferidas contra os valores reais — batem exatamente.

### Constantes
- `BASE = 60` (produtividade de referência da config Baixo Custo — E3 da Planilha3).
- `BASE_ALTA = 90` (produtividade de referência da config Alta Produtividade — G3 da Planilha3).
- `taxaMensal` padrão = `0.016` (1,6% a.m.).

### Seleção de configuração e interpolação de insumos

O operacional salta binariamente (réplica de `E15 = IF(G3>60, G10, E10)`):
```
opVal = produtividade > BASE ? opAlta : opBaixo
```

Os insumos são **interpolados linearmente** entre as duas configs (réplica de
`E14 = IF(G3>60, E5+O33, E5)` de `PRODUCAO SOJA`, onde `O33` é o delta de
investimento total proporcional à posição de produtividade no intervalo [60, 90]):
```
if produtividade <= 60:
    insumos = subBaixo

if produtividade > 60:
    deltaTotal = (subAlta + opAlta) - (subBaixo + opBaixo)   // H11 da Planilha3 ≈ 1253,41
    range     = BASE_ALTA - BASE                              // 30
    deltaP    = min(produtividade - BASE, range)
    insumos   = subBaixo + (deltaP / range) × deltaTotal
```
Nota: `deltaTotal` inclui o delta de operacional (100), por isso a fórmula usa
o investimento total como base da interpolação e não apenas os insumos. Isso
replica fielmente a planilha — inclusive o leve "overshooting" aos 90 sc/ha.

### Subtotal de insumos (seed)
```
subtotalInsumos(lista) = SOMA ( quantidade_i x valor_i )
```
Valores de referência das configs (sem interpolação):
- Baixo Custo: **R$ 3.263,8221**
- Alta Produtividade: **R$ 4.417,2365**

### Custo operacional (soma dos 4 itens da config ativa)
```
opVal = plantio + colheita + manutencao + outros
```
- Baixo Custo: 350 + 250 + 400 + 300 = **1.300**
- Alta Produtividade: 350 + 350 + 400 + 300 = **1.400**

### Investimento total
```
investimentoTotal = insumos + opVal
```

### Preço da saca
```
precoSaca = barter ? precoFuturo : precoDisp
```
- `precoDisp` = preço da commodity no dia (à vista).
- `precoFuturo` = preço de travamento em bolsa (futuro).
- (Réplica de `IF(M3="N", I3, K3)`.)

### Receita bruta
```
receita = produtividade x precoSaca
```

### CORRECAO 1 — Custo financeiro do BARTER (juros compostos)
Quando `barter = verdadeiro`, o investimento total é corrigido por juros
COMPOSTOS entre a data de hoje e a data de travamento. Quando falso, é 0.
```
meses       = (dataTravamento - dataHoje) / 30        // em dias/30
custoBarter = barter
              ? investimentoTotal x ( (1 + taxaMensal)^meses - 1 )
              : 0
```
Helper:
```
mesesEntre(dataInicio, dataFim) = (dataFim - dataInicio) em dias / 30
```
(Datas inválidas -> 0.)

### CORRECAO 2 — ARRENDAMENTO (usa SEMPRE o preço disponível)
```
custoArrend = arrendamento_em_sc_ha x precoDisp
```
Atenção: usa o **preço disponível** (à vista), mesmo em cenário barter —
nunca o preço futuro. (Réplica de `Planilha3!E12 = C12 x E14`, onde
`E14 = PRODUCAO!I3` = preço disp.)

### Custo total, lucro, margem
```
custoTotal        = investimentoTotal + custoBarter + custoArrend
lucroOperacional  = receita - custoTotal
margem            = lucroOperacional / receita
```

### Ponto de equilíbrio e custo por saca
```
pontoEquilibrio = custoTotal / precoSaca        (em sc/ha)
custoPorSaca    = custoTotal / produtividade    (em R$/sc)
```

### ÁREA PLANTIO — totais da fazenda (escala os indicadores por hectare)
A "Área Plantio" (Q3 da planilha, padrão 400 ha) é um multiplicador que converte
os indicadores por hectare em valores absolutos da operação inteira. NÃO altera
nenhuma fórmula por hectare — apenas adiciona uma camada de totais.
```
receitaTotalFazenda      = receita          x area
custoTotalFazenda        = custoTotal       x area
investimentoTotalFazenda = investimentoTotal x area
lucroTotalFazenda        = lucroOperacional x area     // réplica de Q20 = Q3 x E28
producaoTotalFazenda     = produtividade    x area     // sacas totais
```
Validação (área = 400 ha, caso A): lucroTotalFazenda ~ **-338.711,57**;
receitaTotalFazenda = **2.592.000**.

### Casos de validação (devem bater exatamente)

**Caso A — barter ligado (caso da planilha corrigida):**
Entrada: produtividade=60, precoDisp=125, precoFuturo=108, barter=true,
arrendamento=15, taxaMensal=0.016, dataHoje='2026-05-29',
dataTravamento='2027-04-30', insumos/operacional nos valores de seed.
- meses ~ **11,2**
- custoBarter ~ **887,96**
- custoArrend = **1.875,00**
- custoTotal ~ **7.326,78**
- receita = **6.480**
- lucroOperacional ~ **-846,78**
- margem ~ **-0,1307** (-13,07%)

**Caso B — barter desligado (continua válido):**
Entrada: produtividade=60, precoDisp=125, precoFuturo=108, barter=false,
arrendamento=0, dados iniciais.
- investimentoTotal = **4.563,8221**
- receita = **7.500**
- lucroOperacional = **2.936,1779**
- margem ~ **0,3915** (39,15%)
- pontoEquilibrio ~ **36,5106 sc/ha**
- custoPorSaca ~ **76,0637 R$/sc**

**Caso C — interpolação linear (produtividade intermediária, barter=N):**
Entrada: produtividade=62, precoDisp=125, precoFuturo=108, barter=false,
arrendamento=15, dados iniciais.
- usaAlta = true (62 > 60)
- deltaTotal = (4417,2365+1400)−(3263,8221+1300) = **1.253,4144**
- insumos = 3263,8221 + (2/30)×1253,4144 = **3.347,3831**
- opVal = **1.400** (salto binário)
- investimentoTotal = **4.747,3831**
- custoArrend = 15×125 = **1.875,00**
- receita = 62×125 = **7.750,00**

> **Escreva testes unitários com OS TRÊS casos.** Se algum não passar, a port
> da lógica está errada — não ajustar os números esperados, corrigir o cálculo.

## 6. Dados iniciais (seed)

As listas completas de insumos das duas configurações e os custos operacionais
estão no `CustoSoja.jsx` (constantes `INSUMOS_BAIXO_INIT`, `INSUMOS_ALTA_INIT`,
`OPERACIONAL_INIT`). Use-as como **seed** do banco (`prisma/seed.ts`).

Observações sobre a planilha original:
- Os fertilizantes da config Baixo Custo usavam uma fórmula `FV()` de correção,
  mas com parâmetros vazios -> equivalem ao valor cheio. Usar valor nominal.
- A semente "TORMENTA" do Baixo Custo já está com o valor corrigido (13243.3).

## 7. Persistência: do protótipo para o real

No `CustoSoja.jsx`, cenários são salvos via `window.storage` (storage do
artifact). **Substituir** por chamadas a rotas de API Next.js:
- `POST /api/cenarios` — cria
- `GET /api/cenarios?safraId=...` — lista
- `DELETE /api/cenarios/:id` — remove

O formato do objeto de cenário já está pronto (seção 4) e inclui os parâmetros
do barter; mapear direto para o modelo Prisma.

## 8. Convenções

- Comunicação e UI em **português do Brasil**.
- Moeda formatada em BRL (`Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })`).
- Taxa mensal exibida na UI em **% a.m.** (ex.: 1,6) e convertida para fração
  (0.016) antes de entrar no cálculo.
- Sem inflar dependências: usar o que a stack já oferece.
- Commits pequenos e descritivos. Sincronizar com GitHub via `gh`.

## 9. Roadmap sugerido (ordem de execução)

1. Scaffold Next.js + TS + Tailwind + Prisma + Auth.js.
2. Schema Prisma (seção 4, incluindo campos do barter) + migração inicial +
   `seed.ts` com os dados da seção 6.
3. `lib/calc.ts` — portar a lógica da seção 5 (com as duas correções) + testes
   dos casos A e B.
4. Portar a UI do `CustoSoja.jsx` para componentes Next (App Router), incluindo
   o painel "Condições do barter" e o KPI de decomposição do custo total.
5. Rotas de API de cenários + trocar `window.storage` por fetch.
6. Auth.js com Microsoft Entra ID.
7. Dockerfile + docker-compose (app + Postgres) OU configurar Vercel + Neon.
8. README com instruções de setup e deploy.
