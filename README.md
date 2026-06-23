# Lari Finance

Aplicação de controle financeiro para profissionais autônomos. Permite registrar lançamentos de pagamentos, calcular automaticamente impostos e despesas, gerar relatórios por período e exportar os dados em PDF ou Excel.

## Funcionalidades

- **Autenticação** — login e cadastro via API, sessão persistida em localStorage
- **Lançamentos** — criação, edição e exclusão de entradas com cliente, valor, método de pagamento, data e observações; sincronizadas com a API e cacheadas offline
- **Cálculos automáticos** — IVA, despesas fixas, produtos, salário e reserva de imposto anual calculados por entrada, via API ou fallback local
- **Relatórios** — visões por dia, semana, mês ou período personalizado com totais, ticket médio, top cliente e breakdown por método de pagamento
- **Exportação** — XLSX (lançamentos, resumo e breakdown por método) e PDF
- **Configuração por ambiente** — taxas, moeda, locale e URL da API configuráveis via variáveis de ambiente em runtime, sem necessidade de rebuild

## Tecnologias

- [Angular 21](https://angular.dev) · TypeScript 5.9 · RxJS 7.8
- [Vitest](https://vitest.dev) (testes unitários)
- [jsPDF](https://github.com/parallax/jsPDF) + jspdf-autotable (exportação PDF)
- [xlsx](https://github.com/SheetJS/sheetjs) (exportação Excel)
- [Lucide Angular](https://lucide.dev) (ícones)
- [Caddy](https://caddyserver.com) (servidor web em produção, com TLS automático)

## Desenvolvimento local

Pré-requisitos: Node.js 22+, npm 11+.

```bash
npm install
npm start
```

A aplicação estará disponível em `http://localhost:4200/`. As requisições de API são encaminhadas pelo proxy configurado em `proxy.conf.json`.

## Variáveis de ambiente

Copie `.env.example` para `.env` para sobrescrever a configuração local:

```bash
cp .env.example .env
```

O arquivo `public/env.js` é gerado automaticamente por `npm start` e `npm run build`. No Docker, é recriado na inicialização do container a partir das variáveis reais do ambiente.

| Variável | Descrição | Padrão |
|---|---|---|
| `API_BASE_URL` | URL base da API. As rotas são compostas a partir dela (`/auth/login`, `/auth/register`, `/finance/calculate`, `/finance/rates`, `/entries`) | `/api` |
| `LARI_LOCALE` | Locale usado nos formatadores de moeda e data | `es-ES` |
| `LARI_CURRENCY` | Código da moeda (ISO 4217) | `EUR` |
| `LARI_HERO_IMAGE_URL` | URL da imagem exibida no topo da aplicação | — |
| `LARI_IVA_RATE` | Percentual de IVA (entre 0 e 1) | `0.21` |
| `LARI_FIXED_EXPENSES_RATE` | Percentual de despesas fixas | `0.20` |
| `LARI_PRODUCTS_RATE` | Percentual de produtos | `0.08` |
| `LARI_SALARY_RATE` | Percentual de salário | `0.41` |
| `LARI_ANNUAL_TAX_RESERVE_RATE` | Percentual de reserva de imposto anual | `0.10` |
| `APP_PORT` | Porta exposta pelo Docker Compose | `8080` |
| `PORT` | Porta injetada pelo Railway em produção | — |
| `DOCKER_IMAGE` | Nome da imagem Docker usada no Compose | — |

## Docker e Railway

Para executar localmente com Docker Compose:

```bash
docker compose up --build
```

A aplicação estará disponível na porta definida por `APP_PORT`. Para parar:

```bash
docker compose down
```

No Railway, publique o repositório com o `Dockerfile` na raiz. O Railway detecta o `Dockerfile` automaticamente e injeta a variável `PORT`; o Caddy usa essa porta em runtime. Configure `API_BASE_URL` e as variáveis `LARI_*` no painel do Railway para ajustar endpoint, moeda, imagem ou percentuais sem modificar o código.

## Testes

```bash
ng test
```

Executa os testes unitários com [Vitest](https://vitest.dev).

## Build de produção

```bash
npm run build
```

Os artefatos gerados ficam em `dist/`. A build de produção é otimizada automaticamente pelo Angular CLI.
