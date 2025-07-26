# Multi-IDE Rules Generator (MIRG)

## Unified Product Requirements & Environments Specification — v0.94

*(Senior-Engineer draft for pre‑public release — verbose, ultra‑technical, lossless detail)*

---

## 0. Executive Summary

The Multi‑IDE Rules Generator (MIRG) is a hybrid SaaS/CLI platform for creating, ingesting, managing, searching, optimizing, and deploying IDE‑specific rule packages consumed by Claude Code, Cursor, CLINE, ROOCode, and related AI coding agents. v1.0 must ship with:

- Seamless Taskmaster AI MCP 2.0 integration (project bootstrap, bidirectional sync, memory‑share hooks).
- A resilient knowledge‑base pipeline (Weaviate + LangChain) with full recursive coverage, incremental diffing, advanced metadata, and knowledge‑graph visualization.
- End‑to‑end rule CRUD via UI, REST, GraphQL, and CLI with versioning, audit logging, and optional approval workflows.
- Hybrid semantic/keyword/fuzzy search, coverage heatmaps, contextual recommendations, and AI‑assisted ranking.
- A token‑budget optimizer with priority‑weighted selection and optional genetic compression fallback.
- Enterprise‑grade security/compliance (SSO, audit trails, data residency, pseudonymization, point‑in‑time restore).
- AI‑powered automation for rule synthesis, natural‑language rule creation, A/B testing, and predictive analytics.
- Plugin/IDE orchestration across Cursor, VS Code, IntelliJ, CLINE, ROOCode, and Claude Code CLI, including cross‑IDE migration utilities and in‑IDE extensions.
- Production‑hardened DevOps (GitHub Actions → Docker Buildx → ArgoCD blue/green → Datadog/Grafana observability).

Current implementation has known gaps (watch‑sync, incremental KB indexing, CRUD endpoints, token optimizer, Shadcn UI components, deploy verify/rollback, interactive rule editor). This spec integrates those gaps and adds container/runtime contracts for deterministic execution.

---

## 1. Vision & Objectives

| Goal                                  | KPI                                         | Target v1.0 | Stretch v1.1 |
| ------------------------------------- | ------------------------------------------- | ----------- | ------------ |
| Project bootstrap & MCP orchestration | End‑to‑end `init → first package` lead‑time | < 90 s      | < 30 s       |
| Rule CRUD latency                     | P50 POST `/api/rules/add`                   | < 400 ms    | < 200 ms     |
| KB coverage                           | % of KB items vectorized/searchable         | ≥ 99%       | 100%         |
| Optimizer accuracy                    | % of contexts within token budget           | ≥ 97%       | ≥ 99%        |
| Deploy guard                          | Monthly failed rollout auto‑reverts         | ≤ 1%        | ≤ 0.1%       |
| Search relevance                      | MAP\@10 (hybrid)                            | ≥ 0.85      | ≥ 0.90       |
| System uptime                         | All environments                            | ≥ 99.5%     | ≥ 99.9%      |

---

## 2. Functional Scope & Feature Matrix

| Category                           | Must‑Have (v1.0)                                                                                                                                                           | Nice‑to‑Have (v1.1+)                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **1. Taskmaster MCP Bootstrap**    | `taskmaster init rules-generator` scaffolds `.taskmaster/`, `.cursor/`, `.clinerules/`, `.roo/`, `.env.mcp`; git init + `.gitignore` for secrets                           | Preseed sample rule packages; template override UI              |
| **2. Live Folder Sync**            | Chokidar‑based watch with debounce (Z:→NAS W:); conflict‑safe staging commits via Taskmaster memory hooks                                                                  | IDE hot‑reload integrations                                     |
| **3. Dependency Bootstrap**        | Containerized `pnpm install` for FE/BE; LangChain, Radix UI, Shadcn; Node pin via Volta                                                                                    | Local code signing                                              |
| **4. KB Ingestion**                | Recursive scan, SHA‑256 diffing; parsers for `.md`, `.mdc`, `.json`, `.prompt`; batch embed (OpenAI Ada 3) → Weaviate HNSW                                                 | OCR/PDF ingestion; doc intelligence                             |
| **5. Search**                      | Hybrid BM25 + vector + optional fuzzy; filters (`ide`, `framework`, `tags`, `score`, `date`); coverage dashboards & heatmaps                                               | LLM reranker; personalized ranking                              |
| **6. Rule CRUD & Versioning**      | Fastify REST: `/api/rules/add`, `PUT /api/rules/{id}`, `DELETE /api/rules/{id}`, `POST /api/rules/batch-import`; Zod validation; JWT auth; soft‑delete; semver; audit logs | GraphQL mirror; Taskmaster merge approval flow                  |
| **7. Token Optimizer**             | Priority‑weighted selection (`(priority*relevance)/tokens`); `/optimize?budget=` returns ordered list + size                                                               | Genetic compression for overflows; multi‑file split suggestions |
| **8. Deployment Guard**            | Pre‑deploy: `docker compose config`, tests, lint; Post‑deploy: `/healthz` polling (3× fail → auto‑rollback); blue/green via ArgoCD                                         | Canary with synthetic traffic                                   |
| **9. Interactive Rule Editor**     | Monaco editor modal; syntax highlighting; live preview; metadata panel; conflict prompts on out‑of‑band edits                                                              | CRDT multi‑user co‑editing; inline “Explain this rule”          |
| **10. Knowledge Graph & Metadata** | Graph of all rules (KB + personal); edges: `extends`, `relatedTo`, `conflictsWith`; metadata: repo, author, version, tags, tier, tokenCount                                | D3.js graph explorer; optional Neo4j export                     |
| **11. Personal Rule Management**   | Annotation/explanation field (indexed); batch import/export wizards for `.mdc`/`.json`; inheritance templates with base→derived merge                                      | A/B testing; team collections & sharing                         |
| **12. API & Webhooks**             | REST + GraphQL for CRUD/search; webhooks (`rule.added`, `kb.reindexed`, `mcp.sync`); rate‑limit+monitoring                                                                 | Slack/Teams alerts                                              |
| **13. Security & Compliance**      | SSO (OAuth2/SAML), audit trails (SIEM‑ready), data residency controls, PII pseudonymization, nightly snapshots & point‑in‑time restore                                     | GDPR/CCPA DSR portal; FIPS crypto                               |
| **14. AI Automation**              | Effectiveness scoring; predictive recommendations; NL→`.mdc` scaffolds; AI rule synthesis & de‑duplication                                                                 | RL‑based optimizer; auto‑documentation                          |
| **15. Plugin/IDE Orchestration**   | SDK for VS Code/IntelliJ; cross‑IDE migration (Cursor↔CLINE↔ROOCode↔CLI); CI validation of packages per IDE                                                                | Additional IDEs; web‑IDE embeds                                 |

---

## 3. Reference Architecture

```
            ┌── IDE Plugins & CLI ──┐
            │ VSCode/IntelliJ/      │
            │ CLINE/ROOCode/CLI     │
            └───────▲────────────────┘
                    │ slashcmd / RPC
      ┌──────────┐  │       ┌─────────────────────────┐
      │ Frontend │◀─┴─REST──│   Backend (Fastify)     │
      │ (Vite/TS)│          │ • Rule CRUD             │
      └───▲──────┘          │ • Index Controller      │
          │ SSE/Web         │ • Optimizer Service     │
          │ GraphQL         │ • Graph Service         │
          │                 └─────────▲───────────────┘
          │                           │ LangChain
┌─────────┴───────────┐       ┌────────┴────────┐
│    PostgreSQL       │ meta  │   Weaviate      │ vectors
│ Rules meta, audit   │◀──────▶│ HNSW + hybrid  │
└─────────────────────┘       └─────────────────┘
            ▲
            │
      ┌─────┴────┐
      │ Taskmaster│
      │  MCP 2.0  │ WS + shared FS
      └───────────┘
```

---

## 4. Detailed Module Requirements

### 4.1 Taskmaster AI MCP Integration

- **Project Sensing**: Parse `.taskmaster/config.json` and `.env.mcp` at startup; hydrate `IDE_TARGETS`, `KB_ROOT`, `TOKEN_BUDGETS`, `MCP_WS_URL`; validate with Zod.
- **Bidirectional Sync**: Outbound rule mutations emit `memory.patch` via MCP WebSocket; inbound `job.completed` or `config.changed` triggers diff‑based reindex and cache invalidation.
- **Folder Contracts**: `.cursor/rules/`, `.clinerules/`, `.roo/` treated as mount points—MIRG writes new/updated rules, never deletes; `.taskmaster/memory.md` append‑only with dedupe in optimizer.

### 4.2 Knowledge‑Base (KB) Pipeline

- **Loader**: Cron or MCP event every 60 s (or on demand); SHA‑256 hashing per file to skip unchanged; per‑file status maintained.
- **Parser**: Supports `.md`, `.mdc`, `.json`, `.prompt`; extracts `ide`, `framework`, `tier`, `tags`, `estimatedTokens`.
- **Embedder**: Chunking ≤ 1,000 tokens; OpenAI Ada 3 embeddings; batch upsert (≤ 512/doc op) into Weaviate HNSW; metadata persisted.
- **Audit & Coverage**: `/admin/audit-kb` returns totals, embedded count, parse/embedding errors, orphan files, missing metadata; UI shows coverage heatmaps.

### 4.3 Rule CRUD & Versioning

- **Endpoints**
  - `POST /api/rules/add` — body `{ content, meta: { ide, framework, … } }` → embed + upsert (Weaviate) + insert meta (Postgres) + audit log.
  - `PUT /api/rules/{id}` — partial updates; re‑embed; bump semver; append audit log.
  - `DELETE /api/rules/{id}` — soft delete (`deleted:true`), audit log; optional admin‑only hard‑delete guard.
  - `POST /api/rules/batch-import` — ZIP upload; async job; SSE progress; bulk upsert.
  - `GET /api/rules/search` — hybrid search with filters; paginated results; optional reranker.
  - `GET /api/rules/{id}/history` — version list and diffs.
- **Auth & Validation**: JWT roles (`user`, `dev`, `admin`); Zod schemas; pino structured logging.

### 4.4 Token‑Budget Optimizer

- **Algorithm**: Score = `(priorityWeight × semanticRelevance) / tokenCount`; sort desc; accumulate until sum(tokens) ≥ budget; if overflow ≤ 5%, truncate tail; else optional genetic compression; multi‑file split recommendation if required.
- **Endpoint**: `GET /api/optimize?budget=8000&ide=cursor` returns ordered rule list, `totalTokens`, `estimatedUsage%`, and optional split plan.

### 4.5 Deployment Guard

- **Pre‑deploy**: `docker compose config`; `pnpm test` (Vitest ≥ 90% statements); `pnpm lint` zero errors.
- **Post‑deploy**: Probe `/healthz` every 5 s up to 12 tries; on ≥ 3 consecutive failures, ArgoCD auto‑rollback.

### 4.6 Knowledge Graph & Advanced Metadata

- **Graph Construction**: Nodes for KB + personal rules; edges: `extends`, `relatedTo`, `conflictsWith`; adjacency list in Postgres + semantic links in Weaviate.
- **Fields**: `sourceRepo`, `author`, `createdAt`, `updatedAt`, `version`, `ide`, `framework`, `tier`, `tags[]`, `tokenCount`, `priorityWeight`.
- **API**: `GET /api/graph?ide=react` returns JSON graph; UI graphs in D3.js.

### 4.7 Dynamic & Personal Rule Management

- **Annotation Field**: `explanation: string` persisted and indexed; shown in search tooltips and CLI assist.
- **Inheritance Templates**: `extends: [baseRuleId]` with deterministic merge; conflicts highlighted in editor.
- **Batch Wizards**: ZIP import/export of `.mdc`/`.json` with mapping preview; personal namespace segregation.
- **Approval Flow (optional)**: `pending → approved` via admin endpoint; only approved rules included in public packages.
- **A/B Testing (optional)**: Tag variants under `experiment:{id}`; collect usage metrics; compare success via `/api/experiments/{id}/results`.
- **Team Sharing**: Export/import endpoints for team collections; role‑based access.

### 4.8 Search, Filtering & CLI Optimization

- **Hybrid Fuzzy**: Combine cosine similarity with fuzzy match; adjustable threshold; explicit filter parameters.
- **Contextual Recommendations**: `GET /api/recommendations?context=[…]` uses history and project config to propose additional rules.
- **Heatmaps**: UI shows KB coverage per IDE/framework/tier; drill‑down lists missing areas.
- **CLI Command Autogen**: `GET /api/cli-command?ids=&budget=` returns a validated `claude-code` command with `--context` and `--memory-file`, including split suggestions if needed.

### 4.9 API & Webhook Ecosystem

- **GraphQL**: Mirrors REST CRUD/search; subscriptions for rule/memory events (IDE plugins).
- **Webhooks**: Events (`rule.added`, `rule.updated`, `kb.reindexed`, `mcp.synced`, `deploy.status`) with configurable endpoints.
- **Rate Limiting & Monitoring**: 60 req/min/IP (search), 10 req/min/IP (mutations); `/metrics` (Prometheus) integrated into Grafana dashboards.

### 4.10 Enterprise Security & Compliance

- **SSO**: OAuth2/OIDC (Okta/Azure AD); JWT introspection for APIs.
- **Audit Logging**: JSONL in object storage with (user, endpoint, payload hash, diff); SIEM‑ready.
- **Data Residency**: Region‑targeted vector and meta stores; encryption‑at‑rest via KMS; configurable retention.
- **PII**: Pseudonymize user content prior to embedding (store hash only).
- **Backup/Restore**: Nightly snapshots (Weaviate + Postgres); point‑in‑time restore workflow.
- **Org Reporting**: `/api/reports/usage?teamId=` returns CSV/XLSX on rule usage, uptime, support metrics.

### 4.11 AI‑Powered Automation

- **Effectiveness Models**: LightGBM on historical optimize/search/experiment data; `GET /api/models/evaluate?ruleId=`.
- **Predictive Forecasting**: Time‑series predictions of needed rules by project type; surfaced in UI.
- **NL→Rule**: `POST /api/nl2rule` accepts prose; emits `.mdc` scaffold with validation hints.
- **Auto‑Synthesis**: LLM pipeline merges similar KB rules; de‑dup via fuzzy clustering; tagged provenance.

### 4.12 Plugin & IDE Orchestration

- **IDE SDK**: NPM packages for VS Code/IntelliJ enabling search, CRUD, optimization within IDE.
- **Cross‑IDE Migration**: `mirg migrate --from cursor --to intellij` converts `.mdc` formats via schema mapping.
- **CI Validation**: Jobs spin headless IDEs to load generated packages and validate syntax/compatibility.

---

## 5. Environments Matrix

| Layer      | Local Dev               | Integration           | Staging                 | Production           |
| ---------- | ----------------------- | --------------------- | ----------------------- | -------------------- |
| URL        | `http://localhost:5173` | `http://int.mirg.lan` | `https://stage.mirg.io` | `https://mirg.io`    |
| Auth       | Mock JWT                | Keycloak (dev realm)  | Keycloak (stage)        | Auth0/OIDC           |
| DB         | Docker Postgres 15      | Shared PG13           | Aurora PG (multi‑AZ)    | Aurora PG (multi‑AZ) |
| Vector     | Weaviate local          | K8s Weaviate (1×)     | K8s (3×)                | K8s (5×)             |
| CI         | —                       | GitHub Actions        | GH Actions + Trivy      | GH Actions + Trivy   |
| CD         | —                       | Portainer Swarm       | ArgoCD (blue/green)     | ArgoCD (blue/green)  |
| Secrets    | `.env.local`            | Doppler dev           | Doppler stage           | AWS SecretsManager   |
| Monitoring | VS Code logs            | Grafana‑Loki          | Grafana Cloud           | Datadog + PagerDuty  |

---

## 6. Security & Compliance

- OWASP Top‑10 scanning on each PR; block high‑severity.
- Containers run as non‑root UID 1001; least‑privilege mounts (prefer `:ro` on KB paths).
- Rate‑limit endpoints; bot/abuse mitigation.
- PII pseudonymization prior to embeddings.
- Audit retention: 7 years in Glacier or equivalent.

---

## 7. Quality‑Assurance Strategy

| Layer    | Tooling                 | Target                         |
| -------- | ----------------------- | ------------------------------ |
| Unit     | Vitest + ts‑mock        | ≥ 90% statements               |
| API      | Supertest/Playwright    | CRUD + search + optimize paths |
| Vector   | Custom MAP harness      | MAP\@10 ≥ 0.85                 |
| UI       | Cypress (component/e2e) | All critical flows             |
| Load     | k6 / Locust             | p95 < 1 s @ 10k VUs            |
| Security | OWASP ZAP, Burp         | No high‑severity               |
| UAT      | Stakeholder scripts     | 100% acceptance pass           |

---

## 8. Outstanding Gaps & Mitigation Plan

| Gap                           | Owner    | Sprint | Mitigation                                                   |
| ----------------------------- | -------- | ------ | ------------------------------------------------------------ |
| Shadcn badge/progress imports | Frontend | 34     | Pin `@radix-ui/react-progress`; fix Shadcn generator exports |
| Watch‑sync (Z:→NAS)           | DevOps   | 34     | Chokidar + debounce + Taskmaster hooks                       |
| Incremental KB indexing       | Backend  | 35     | SHA‑256 diffing + per‑file status; unit tests                |
| Deploy health‑gate/rollback   | DevOps   | 35     | ArgoCD rollback on `/healthz` failures                       |
| Token estimator               | AI Infra | 35     | Integrate `tiktoken` or TS tokenizer approx                  |
| Monaco editor embedding       | Frontend | 36     | Add Monaco; wire metadata; handle conflict prompts           |

---

## 9. Acceptance Criteria (Definition of Done)

1. Feature parity with must‑have items 1–15 (Section 2) validated in Integration.
2. KB coverage ≥ 99% with `/admin/audit-kb` showing zero parse/embed errors.
3. CRUD latency P50 < 400 ms, P95 < 800 ms at target traffic.
4. Optimizer achieves ≥ 97% budget compliance in 95%+ runs.
5. Search MAP\@10 ≥ 0.85 on test corpus.
6. Pre/post‑deploy gates green for 24 h in Staging before Prod.
7. Security scans pass with zero high/critical findings.
8. SSO and audit flows validated end‑to‑end in Integration.
9. IDE plugins (VS Code & IntelliJ) pass smoke tests (search/CRUD/optimize).
10. Release tagged `v1.0.0`; immutable images pushed; CHANGELOG updated.

---

## Appendix A — Glossary

- **MCP**: Model Context Protocol for Taskmaster AI orchestration.
- **KB**: Knowledge Base of rule files and metadata.
- **HNSW**: Hierarchical Navigable Small World index in Weaviate.
- **SemVer**: Semantic Versioning.
- **CRDT**: Conflict‑free Replicated Data Type for real‑time collaboration.
- **MAP\@10**: Mean Average Precision at top‑10.
- **SSE**: Server‑Sent Events.

---

## Appendix X — Container & Volume Topology

### X.1 Host → Container Mount Matrix

| Host Location                       | Purpose                         | Mount Type                       | Container Path                      | R/W | Consumers                          |
| ----------------------------------- | ------------------------------- | -------------------------------- | ----------------------------------- | --- | ---------------------------------- |
| `Z:\projects\rules-generator` (NAS) | Source repo, artifacts, context | Bind                             | `/mnt/nas/projects/rules-generator` | RW  | MIRG, Claude CLI, Taskmaster MCP   |
| `C:\GitHub\` (workstation)          | IDE working trees               | Bind                             | `/host/github`                      | RW  | MIRG (index), CLI, IDE agents      |
| `C:\Taskmaster-MCP\`                | MCP config & memory             | Bind (shared with MCP container) | `/mcp`                              | RW  | MIRG (memory.patch), MCP (watcher) |
| `/mnt/c/Users/<user>/` (WSL)        | CLI scripts, temp assets        | Bind                             | `/wsl/home`                         | RW  | MIRG tasks, CLI sidecar            |
| `Z:\docker\` (NAS)                  | Docker assets/cache             | Bind                             | `/shared/docker`                    | RW  | Build cache (optional)             |

**Notes**

- Enable file sharing for **C:** and **Z:** in Docker Desktop.
- If NAS SMB permissions are strict, run Docker Desktop as a user with Z: access or mount via UNC.

### X.2 Compose Profiles (Local‑Dev vs Workstation)

```yaml
services:
  mirg:
    image: ghcr.io/yourorg/mirg:latest
    user: "1001:1001"
    volumes:
      - type: bind
        source: Z:\projects\rules-generator
        target: /mnt/nas/projects/rules-generator
      - type: bind
        source: C:\GitHub
        target: /host/github
      - type: bind
        source: C:\Taskmaster-MCP
        target: /mcp
      - type: bind
        source: /mnt/c/Users/<user>
        target: /wsl/home
    networks: [mirg_net]
    environment:
      - MCP_WS_URL=ws://taskmaster:8080/ws
      - KB_ROOT=/mnt/nas/projects/rules-generator/knowledge-base
      - IDE_TARGETS=cursor,clinerules,roo
  taskmaster:
    image: ghcr.io/yourorg/taskmaster:latest
    volumes:
      - type: bind
        source: C:\Taskmaster-MCP
        target: /mcp
    networks: [mirg_net]

  claude-cli:
    image: ghcr.io/yourorg/claude-cli:latest
    depends_on: [mirg]
    volumes:
      - Z:\projects\rules-generator:/mnt/nas/projects/rules-generator
      - C:\GitHub:/host/github
    networks: [mirg_net]

networks:
  mirg_net: {}
```

**Profiles**

- `dev-local`: NAS + GitHub mounts; MCP co‑resident.
- `workstation`: add WSL bind for CLI scripting.
- `cloud`: no host binds → use agent (see X.6) or object storage.

### X.3 Filesystem Contracts

| Path (container)                | Contract                                                                   | Producer(s)  | Consumer(s)         |
| ------------------------------- | -------------------------------------------------------------------------- | ------------ | ------------------- |
| `/mnt/nas/.../.context/*.md`    | Claude context payloads; MIRG may create/overwrite; no destructive deletes | MIRG         | Claude CLI, IDEs    |
| `/mcp/memory/*.md`              | Append‑only memory logs; MCP is source of truth; MIRG writes delta patches | MCP, MIRG    | MCP, MIRG           |
| `/mnt/nas/.../.artifacts/*.zip` | Build artifacts; immutable after publish                                   | MIRG         | Operators, CI       |
| `/host/github/<repo>`           | Working trees; MIRG is read‑only by policy unless explicitly allowed       | IDEs, Humans | MIRG (index/search) |

### X.4 Permissions & Identity

- Run as UID\:GID `1001:1001`; ensure host ACLs allow read/write for Docker Desktop user.
- Prefer `:ro` mounts for KB sources.
- Debounce writes to NAS; batch artifact flushes.

### X.5 Health/Latency Targets

| Operation                        | Target                       |
| -------------------------------- | ---------------------------- |
| FS change → watch detection      | ≤ 250 ms local; ≤ 750 ms SMB |
| Rule add → vector upsert         | P50 ≤ 400 ms; P95 ≤ 800 ms   |
| Context package build (≤ 1.5 MB) | ≤ 2 s                        |

### X.6 Hybrid Agent (Cloud‑Only or Locked‑Down Hosts)

- Lightweight local agent (Go/Python) on workstation: watches configured dirs (C:, Z:, `/mnt/c`); streams events/payloads over secure WebSocket/gRPC to cloud‑hosted MIRG.

---

## Appendix Y — Runtime Interaction Contracts

### Y.1 MIRG ↔ Taskmaster MCP

| Direction  | Transport                | Payloads                          | Contract                                        |
| ---------- | ------------------------ | --------------------------------- | ----------------------------------------------- |
| MIRG → MCP | WebSocket (`MCP_WS_URL`) | `memory.patch`, `job.request`     | Append‑only; MCP owns replay & compaction       |
| MCP → MIRG | WebSocket                | `job.completed`, `config.changed` | MIRG triggers diff‑reindex & cache invalidation |
| Shared FS  | Bind `/mcp`              | Memory files, job logs            | Both containers see the same host folder        |

### Y.2 MIRG ↔ Claude Code CLI

| Scenario           | Mechanism                           | Contract                                                                   |
| ------------------ | ----------------------------------- | -------------------------------------------------------------------------- |
| Generate CLI       | `GET /api/cli-command?ids=&budget=` | Returns validated `claude-code` command with `--context` & `--memory-file` |
| Execute in sidecar | `docker compose run claude-cli …`   | Shares mounts with MIRG; no copies                                         |
| Execute on host    | Read from `.context/` on Z:/C:      | Paths resolve identically; no path surgery                                 |

### Y.3 MIRG ↔ IDEs (Cursor/VS Code/IntelliJ)

- IDEs read working trees from `C:\GitHub` (host).
- MIRG indexes the same tree via `/host/github` (bind).
- Conflict policy: IDE is the source of truth under `repo/`; MIRG does not mutate without explicit instruction.

