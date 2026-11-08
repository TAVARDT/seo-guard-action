# TAVARDT SEO Guard Action: CI/CD Search Regression Prevention

<div align="center">
  <p>Automated CI/CD search regression prevention and HTML auditor. Designed for high-ticket B2B digital protection.</p>
  <p>
    <a href="#english">🇺🇸 English</a> | 
    <a href="#portugues">🇧🇷 Português</a>
  </p>
</div>

***

<h2 id="english">🇺🇸 English</h2>

### Overview
This repository contains the official TAVARDT SEO Guard Action for CI/CD pipelines and static web builds (Next.js SSG, Astro, Hugo, Gatsby, Nuxt, Vite). In modern continuous deployment pipelines, silent code commits frequently break critical canonical tags, strip meta descriptions, or accidentally introduce `noindex` directives—causing catastrophic organic traffic loss before marketing teams notice. SEO Guard inspects built HTML files before deployment and halts the build if search regressions are detected.

### 🚨 IMPORTANT: The "Accidental Noindex" Trap
One of the most dangerous silent regressions in web development occurs when staging environment flags (such as `<meta name="robots" content="noindex">`) accidentally leak into production builds. TAVARDT SEO Guard treats any occurrence of `noindex` in your export directory as a **CRITICAL FAILURE**, protecting your domain from unintentional de-indexing in Google and Bing.

### Security & Quality Checks
* **Accidental Noindex Defense:** Halts deployment if staging `noindex` tags are detected in production HTML.
* **Canonical Tag Integrity:** Verifies existence and non-empty `href` values in `<link rel="canonical">`.
* **Title Tag Optimization:** Checks for presence, minimum length (10 chars), and maximum SERP limits (70 chars).
* **Meta Description Validation:** Validates length (40 to 165 characters) and prevents empty tags.
* **Social Graph Tags (OpenGraph):** Audits required `og:title` and `og:image` tags for LinkedIn, WhatsApp, and X previews.
* **Image Accessibility & SEO:** Flags all `<img>` tags missing the `alt` attribute.
* **Structured Data Syntax:** Validates Schema.org `<script type="application/ld+json">` blocks for JSON syntax errors.

### Usage

#### 1. In GitHub Actions Workflow (`.github/workflows/deploy.yml`):
```yaml
name: Production Build & SEO Audit

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build Static Site
        run: |
          npm ci
          npm run build

      - name: TAVARDT SEO Guard
        uses: TAVARDT/seo-guard-action@main
        with:
          html-dir: './out'        # Target build folder (e.g. ./out, ./dist, ./build)
          fail-on-error: 'true'    # Halts pipeline on critical SEO errors
```

#### 2. Local CLI (Zero Dependencies):
```bash
node guard.js ./out
```
Or with custom flags:
```bash
node guard.js --dir ./dist --no-fail
```

#### 3. Via Bash Runner:
```bash
bash guard.sh ./out
```

### Contact & Services
Looking for elite technical SEO, website speed optimization, or custom web design?
* Website: [ag.tavardt.com/digital-marketing](https://ag.tavardt.com/digital-marketing)
* Email: [contact@tavardt.com](mailto:contact@tavardt.com)

***

<h2 id="portugues">🇧🇷 Português</h2>

### Visão Geral
Este repositório contém a Action oficial da TAVARDT para prevenção de regressões de SEO em esteiras de CI/CD e builds estáticos (Next.js SSG, Astro, Hugo, Gatsby, Nuxt, Vite). Em deploys contínuos modernos, alterações de código frequentemente quebram tags canônicas, removem meta descriptions ou introduzem diretivas acidentais de `noindex`—destruindo o tráfego orgânico antes que o time de marketing perceba. O SEO Guard audita os arquivos HTML gerados antes do deploy e bloqueia o pipeline se falhas críticas forem encontradas.

### 🚨 IMPORTANTE: A Armadilha do "Noindex" Acidental
Uma das regressões silenciosas mais perigosas no desenvolvimento web acontece quando configurações de ambientes de homologação/staging (como `<meta name="robots" content="noindex">`) vazam acidentalmente para o build de produção. O TAVARDT SEO Guard classifica qualquer presença de `noindex` nos arquivos de exportação como **FALHA CRÍTICA**, impedindo a desindexação catastrófica do domínio no Google e Bing.

### Camadas de Auditoria & Qualidade
* **Defesa contra Noindex Acidental:** Bloqueia a esteira caso tags de `noindex` de staging vazem no HTML de produção.
* **Integridade de Tags Canônicas:** Verifica a presença e a validade de `<link rel="canonical">`.
* **Otimização de Title:** Audita presença, comprimento mínimo (10 caracteres) e limites de exibição no Google (70 caracteres).
* **Validação de Meta Description:** Checa o tamanho ideal (40 a 165 caracteres) e previne tags vazias.
* **Tags Sociais (OpenGraph):** Garante a presença de `og:title` e `og:image` para pré-visualização no LinkedIn, WhatsApp e X.
* **Acessibilidade e SEO de Imagens:** Mapeia todas as tags `<img>` que não possuem o atributo `alt`.
* **Sintaxe de Dados Estruturados:** Valida se blocos de Schema.org (`application/ld+json`) possuem sintaxe JSON válida.

### Uso

#### 1. No Workflow do GitHub Actions (`.github/workflows/deploy.yml`):
```yaml
name: Build de Produção & Auditoria de SEO

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Build do Site Estático
        run: |
          npm ci
          npm run build

      - name: TAVARDT SEO Guard
        uses: TAVARDT/seo-guard-action@main
        with:
          html-dir: './out'        # Pasta de saída do build (ex: ./out, ./dist, ./build)
          fail-on-error: 'true'    # Bloqueia o deploy em caso de falha crítica
```

#### 2. Execução Local via Node.js (Zero Dependências):
```bash
node guard.js ./out
```
Ou com parâmetros personalizados:
```bash
node guard.js --dir ./dist --no-fail
```

#### 3. Execução via Bash:
```bash
bash guard.sh ./out
```

### Contato & Serviços
Procurando por SEO técnico de elite, otimização de velocidade web ou web design de alto padrão?
* Site: [ag.tavardt.com/br/marketing-digital/](https://ag.tavardt.com/br/marketing-digital/)
* E-mail: [contato@tavardt.com](mailto:contato@tavardt.com)
