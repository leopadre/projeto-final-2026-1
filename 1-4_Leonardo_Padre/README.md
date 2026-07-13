# CréditoIA — Sistema Inteligente de Análise de Crédito
### Trilha 1.4 — Risco de Crédito / Aprovação de Empréstimo

---

**Integrante:** Leonardo Fernandes Padre - 200067036

**Aplicação:** [\[URL DA APLICAÇÃO\]](https://creditai-h0r8.onrender.com/)

**Vídeo de Demonstração:** [\[URL DO VÍDEO\]](https://youtu.be/wT6Og-0V4JU)

---

## 1. Definição do Problema

### A dor e por que importa

A concessão de crédito é uma das decisões mais críticas e recorrentes no setor financeiro. Instituições que dependem de análises manuais ou modelos simplistas enfrentam dois riscos simultâneos: aprovar crédito para inadimplentes (prejuízo financeiro) ou negar crédito a bons pagadores (perda de receita e exclusão financeira). Além disso, decisões opacas geram desconfiança e dificultam a conformidade regulatória.

O produto resolve esse problema ao combinar um modelo preditivo de alta acurácia com uma interface conversacional que coleta dados de forma natural e devolve não apenas a decisão, mas a explicação dos fatores que a determinaram — tornando o processo auditável e compreensível para o solicitante.

### Stakeholders

- **Analistas de crédito:** usam o sistema como ferramenta de apoio à decisão, reduzindo tempo de análise e padronizando critérios.
- **Solicitantes de empréstimo:** recebem resposta rápida com explicação clara dos motivos, melhorando a experiência e a transparência.

### Métricas de Sucesso

**Negócio:** redução do tempo médio de análise por solicitação; aumento da taxa de acerto em relação ao baseline manual; aceitação pelos analistas como ferramenta confiável.

**Técnica:** F1-Score ≥ 0.95 no conjunto de teste; latência de resposta da API < 2s; cobertura dos campos obrigatórios ≥ 95% nas extrações da LLM.

---

## 2. Como o Sistema é Montado

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO (Browser)                        │
│              React + TanStack Router + TailwindCSS              │
└────────────────────────────┬────────────────────────────────────┘
                             │ POST /chat  { message, history, collected }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI  (loan-api:8000)                    │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │  /predict   │   │      /chat       │   │    /health      │  │
│  │  model.pkl  │◄──│   llm.py         │   │  healthcheck    │  │
│  │  SHAP       │   │  extract_fields  │   └─────────────────┘  │
│  │  approx.    │   │  ask_missing     │                         │
│  └─────────────┘   │  explain_result  │                         │
│                    └────────┬─────────┘                         │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS  OpenAI-compatible API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              LLM Provider (Groq)                                │
│  EXTRACTION_SYSTEM → extrai campos do texto do usuário          │
│  CHAT_SYSTEM       → conduz conversa e coleta dados faltantes   │
│  RESULT_SYSTEM     → interpreta JSON da API em linguagem natural│
└─────────────────────────────────────────────────────────────────┘
```

O fluxo de uma requisição segue as etapas:

1. Usuário envia mensagem em linguagem natural
2. LLM extrai campos estruturados via `EXTRACTION_SYSTEM`
3. Campos obrigatórios são verificados — se faltarem, `CHAT_SYSTEM` conduz a coleta conversacional
4. Com todos os campos, `/predict` é chamado internamente com o `model.pkl`
5. `RESULT_INTERPRETATION_SYSTEM` transforma o JSON de resultado em explicação humanizada
6. Frontend renderiza `reply` + decision card

### Agent / Model Exploration

Foram avaliados três algoritmos de classificação sobre o dataset processado:

| Modelo | F1-Score | Accuracy |
|---|---|---|
| Regressão Logística | 0.88 | 0.91 |
| Random Forest | 0.98 | 0.98 |
| XGBoost | 0.98 | 0.99 |
| **Stack (RF + XGBoost + LR)** | **0.98** | **0.99** |

A decisão pelo Stacking foi motivada pela complementaridade dos modelos base: Random Forest captura interações não-lineares, XGBoost é robusto a outliers e a Regressão Logística atua como meta-learner, combinando as predições de forma calibrada. O fine-tuning foi realizado com GridSearchCV sobre os hiperparâmetros de cada estimador base.

Para explicabilidade, foi implementada uma aproximação marginal de SHAP: para cada feature, o modelo é re-inferido com aquela feature substituída pelo valor de referência neutro, e o impacto é calculado como a diferença de probabilidade. Isso permite identificar os fatores mais relevantes sem dependência do pacote `shap`.

### Deployment

O sistema é empacotado em dois containers orquestrados por Docker Compose:

- **loan-api (porta 8000):** FastAPI + Uvicorn servindo os endpoints `/predict`, `/chat` e `/health`. O `model.pkl` é montado via volume read-only a partir do diretório `agent/`.
- **loan-front (porta 3000):** Frontend React/TanStack servido via Nginx. Comunicação com a API via variável de ambiente `VITE_API_URL`.

Para subir o ambiente completo:

```bash
docker compose up --build
```

O arquivo `.env` no diretório `api/` define as variáveis sensíveis (chave da LLM, URL do provider, versão do modelo) e é injetado em ambos os containers via `env_file` no `docker-compose.yml`. O exemplo de .env abaixo:

```bash
MODEL_PATH=/app/model/model.pkl
MODEL_VERSION=1.0.0

PROVIDER_URL=<url-da-api-llm>
LLM_API_KEY=<api-key>
LLM_MODEL=<api-modelo>
```

---

## 3. Descrição do Agente

### Modelo Base e Ferramentas

O sistema utiliza qualquer LLM compatível com a API OpenAI (configurável via variável de ambiente). A configuração padrão utiliza Groq com o modelo `llama-3.1-8b-instant`, escolhido pelos seguintes critérios:

- **Custo:** tier gratuito do Groq viabiliza o projeto sem custo de inferência.
- **Latência:** Groq opera em hardware especializado (LPU), entregando respostas em < 1s para prompts de extração.
- **Capacidade:** llama-3.1-8b demonstrou extração confiável de entidades numéricas em português e seguimento de instruções de formato JSON.

A arquitetura de `llm.py` foi desenhada para ser agnóstica ao provider: basta alterar `LLM_PROVIDER`, `LLM_API_KEY` e `LLM_MODEL` no `.env` para trocar entre Groq, OpenAI e Anthropic sem modificar código.

### Ferramentas do Agente

- **`EXTRACTION_SYSTEM`:** extrai entidades financeiras do texto livre do usuário e retorna JSON estruturado com os 9 campos do modelo.
- **`CHAT_SYSTEM`:** conduz a conversa, aplica guardrails de escopo e solicita campos faltantes de forma conversacional.
- **`RESULT_INTERPRETATION_SYSTEM`:** recebe o JSON completo da API (`decision` + `explanation.factors`) e gera explicação em linguagem natural com os fatores mais relevantes traduzidos.
- **`model.pkl` (Stack Classifier):** modelo de ML treinado off-line que recebe os 9 campos e retorna probabilidade de aprovação com análise de impacto por feature.

### Dados e Contexto

| | |
|---|---|
| **Dataset** | Loan Approval Prediction Dataset |
| **Fonte** | Kaggle — architsharma01/loan-approval-prediction-dataset |
| **Licença** | CC0 (domínio público) |
| **Volume** | 4.269 registros, 13 colunas originais |

Pipeline de preparação dos dados (documentado em `Data Layer/`):

- **raw → silver** (`analytics.ipynb`): análise exploratória, identificação de valores ausentes e distribuições.
- **silver → gold** (`processing.ipynb`): remoção de espaços nos nomes das colunas, encoding da variável target (`Approved=0`, `Rejected=1`), normalização de tipos. O arquivo `processed_loan_approval.csv` é o input do treinamento.

Em tempo de inferência, o agente não consulta base de conhecimento externa — opera exclusivamente com os dados fornecidos pelo usuário na sessão corrente.

### Guardrails

**Validações na entrada (Pydantic — antes de chamar o modelo):**

- `cibil_score` deve estar entre 300 e 900
- `income_annum` e `loan_amount` devem ser > 0
- `loan_term` deve ser > 0
- Campos obrigatórios (`income_annum`, `loan_amount`, `loan_term`, `cibil_score`) devem estar presentes — o agente não chama `/predict` enquanto faltarem

**Guardrails de escopo na LLM (`CHAT_SYSTEM`):**

- Recusa explícita de tópicos fora de crédito: investimentos, política, entretenimento, conselhos jurídicos ou fiscais
- Proibição de inventar ou estimar valores não fornecidos pelo usuário
- Redirecionamento educado quando o usuário desvia do escopo: *"Posso ajudar apenas com sua solicitação de empréstimo. Vamos continuar?"*

### Iterações de Prompt e Design

**Versão 1 — Prompt único (baseline):** um único system prompt tentava fazer extração de dados, condução de conversa e interpretação de resultado simultaneamente. O modelo confundia as responsabilidades, ora respondendo em JSON quando deveria conversar, ora explicando o resultado antes de ter todos os campos.

**Versão 2 — Separação extração/conversa:** criação de `EXTRACTION_SYSTEM` isolado que retorna apenas JSON. Eliminação da contaminação entre extração e resposta ao usuário. Problema residual: o modelo ainda explicava mal os fatores de impacto por não receber a estrutura do JSON da API.

**Versão 3 — Três prompts especializados (versão final):** `EXTRACTION_SYSTEM` com mapeamento explícito de cada campo (o que significa, como converter), `CHAT_SYSTEM` com guardrails formais e lista de campos obrigatórios/opcionais, e `RESULT_INTERPRETATION_SYSTEM` com dicionário de tradução dos feature names e regras explícitas de como ler `impact` e `direction`. Essa separação eliminou os conflitos de instrução e melhorou a precisão da extração de entidades financeiras em português (ex: conversão de salário mensal para renda anual).

---

## 4. Avaliação do Sistema

### Performance do Modelo

| Métrica | Stack (final) | Threshold mínimo |
|---|---|---|
| F1-Score | 0.982 | 0.95 |
| Precision | 0.987 | 0.95 |
| Recall | 0.978 | 0.95 |
| Accuracy | 0.987 | 0.95 |

O conjunto de teste foi separado com estratificação (80/20) para preservar a proporção de classes. As métricas foram calculadas sobre o conjunto de teste holdout, não sobre o conjunto de treino. O alto Precision indica baixa taxa de falsos positivos (crédito aprovado para inadimplentes); o alto Recall indica baixa taxa de falsos negativos (crédito negado para bons pagadores).

### UX — Experiência do Usuário

- Interface conversacional permite que o usuário descreva sua situação livremente, sem necessidade de preencher formulários.
- O agente confirma os dados coletados antes de pedir mais informações, evitando repetição.
- Quando a análise é concluída, o resultado é apresentado em dois níveis: decision card visual (aprovado/negado, probabilidade, risco, gráfico de fatores) e explicação em linguagem natural gerada pela LLM.
- Em caso de erro de conexão com a API ou com o provider LLM, o frontend exibe mensagem de erro descritiva sem travar a interface.
- **Latência média observada:** 2–4s por turno de conversa (dominada pela chamada ao provider LLM); análise completa com chamada ao modelo: 3–6s.


---

## 6. Reflexão sobre o que Aprendemos

### O que funcionou bem

- A separação em três prompts especializados foi a decisão de design mais impactante — eliminou conflitos de instrução e tornou cada componente testável de forma independente.
- O Stacking de modelos entregou métricas superiores a qualquer modelo individual, com ganho mensurável de F1 em relação ao Random Forest e XGBoost isolados.
- A arquitetura agnóstica a provider LLM (configurável via `.env`) permite trocar o modelo sem alterar código, o que se mostrou valioso durante o desenvolvimento.

### O que não funcionou como planejado

- **Prompt único tentando múltiplas responsabilidades:** o modelo misturava JSON com texto conversacional. Resolvido com separação em chamadas independentes.

---

## 7. Impactos e Ética

### Quem pode ser prejudicado por um erro

**Falsos negativos** (negar crédito a bons pagadores) afetam desproporcionalmente grupos historicamente sub-representados no dataset de treinamento. Se o dataset reflete vieses históricos de concessão de crédito — onde certos grupos receberam menos crédito no passado — o modelo pode perpetuar e amplificar essa exclusão.

**Falsos positivos** (aprovar crédito para inadimplentes) geram prejuízo financeiro para a instituição e podem levar o solicitante ao superendividamento, especialmente em valores altos.


### Privacidade e Segurança

- Os dados financeiros inseridos pelo usuário são transmitidos via HTTPS e não são persistidos — processados em memória e descartados ao fim da sessão.
- A chave do provider LLM é armazenada apenas no `.env` server-side e nunca exposta ao browser (o frontend chama `/chat` na própria API, não o provider diretamente).
- O dataset de treinamento é público (CC0) e não contém dados pessoais identificáveis.

### O Sistema como Apoio, não Decisor

O produto é explicitamente posicionado como ferramenta de apoio à decisão, não como decisor autônomo. A explicação dos fatores que determinaram o resultado é parte central do produto — não um complemento — justamente para que analistas humanos possam contestar, auditar e sobrepor a decisão do modelo quando necessário. Sistemas de crédito totalmente automatizados sem supervisão humana representam risco regulatório e ético que esta arquitetura deliberadamente evita.

---

## 8. Referências

- Archit Sharma. *Loan Approval Prediction Dataset*. Kaggle, 2023. https://www.kaggle.com/datasets/architsharma01/loan-approval-prediction-dataset
- Pedregosa et al. *Scikit-learn: Machine Learning in Python*. JMLR 12, pp. 2825–2830, 2011.
- Sebastián Ramírez. *FastAPI*. https://fastapi.tiangolo.com
- Groq API. https://console.groq.com
- Meta AI. *Meta LLaMA 3.1*, 2024. https://llama.meta.com
- Docker Compose. https://docs.docker.com/compose