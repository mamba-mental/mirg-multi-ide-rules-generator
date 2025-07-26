# MIRG — Runtime Appendices (Topology & Contracts)

## Version: v0.94

---

## Appendix X — Container & Volume Topology

### X.1 Host → Container Mount Matrix

| Host Location                         | Purpose                         | Mount Type                       | Container Path                      | R/W | Consumers                          |
| ------------------------------------- | ------------------------------- | -------------------------------- | ----------------------------------- | --- | ---------------------------------- |
| `Z:\\projects\\rules-generator` (NAS) | Source repo, artifacts, context | Bind                             | `/mnt/nas/projects/rules-generator` | RW  | MIRG, Claude CLI, Taskmaster MCP   |
| `C:\\GitHub\\` (workstation)          | IDE working trees               | Bind                             | `/host/github`                      | RW  | MIRG (index), CLI, IDE agents      |
| `C:\\Taskmaster-MCP\\`                | MCP config & memory             | Bind (shared with MCP container) | `/mcp`                              | RW  | MIRG (memory.patch), MCP (watcher) |
| `/mnt/c/Users/<user>/` (WSL)          | CLI scripts, temp assets        | Bind                             | `/wsl/home`                         | RW  | MIRG tasks, CLI sidecar            |
| `Z:\\docker\\` (NAS)                  | Docker assets/cache             | Bind                             | `/shared/docker`                    | RW  | Build cache (optional)             |

**Notes**

- Enable file sharing for **C:** and **Z:** in Docker Desktop.
- If NAS SMB permissions are strict, run Docker Desktop as a user with Z: access or mount via UNC.

---

### X.2 Compose Profiles (Local‑Dev vs Workstation)

```yaml
services:
  mirg:
    image: ghcr.io/yourorg/mirg:latest
    user: "1001:1001"
    volumes:
      - type: bind
        source: Z:\\projects\\rules-generator
        target: /mnt/nas/projects/rules-generator
      - type: bind
        source: C:\\GitHub
        target: /host/github
      - type: bind
        source: C:\\Taskmaster-MCP
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
        source: C:\\Taskmaster-MCP
        target: /mcp
    networks: [mirg_net]

  claude-cli:
    image: ghcr.io/yourorg/claude-cli:latest
    depends_on: [mirg]
    volumes:
      - Z:\\projects\\rules-generator:/mnt/nas/projects/rules-generator
      - C:\\GitHub:/host/github
    networks: [mirg_net]

networks:
  mirg_net: {}
```

**Profiles**

- `dev-local`: NAS + GitHub mounts; MCP co‑resident.
- `workstation`: add WSL bind for CLI scripting.
- `cloud`: no host binds → use agent (X.6) or object storage.

---

### X.3 Filesystem Contracts

| Path (container)                | Contract                                                                   | Producer(s)  | Consumer(s)         |
| ------------------------------- | -------------------------------------------------------------------------- | ------------ | ------------------- |
| `/mnt/nas/.../.context/*.md`    | Claude context payloads; MIRG may create/overwrite; no destructive deletes | MIRG         | Claude CLI, IDEs    |
| `/mcp/memory/*.md`              | Append‑only memory logs; MCP is source of truth; MIRG writes delta patches | MCP, MIRG    | MCP, MIRG           |
| `/mnt/nas/.../.artifacts/*.zip` | Build artifacts; immutable after publish                                   | MIRG         | Operators, CI       |
| `/host/github/<repo>`           | Working trees; MIRG is read‑only by policy unless explicitly allowed       | IDEs, Humans | MIRG (index/search) |

---

### X.4 Permissions & Identity

- Run as UID\:GID `1001:1001`; ensure host ACLs allow read/write for Docker Desktop user.
- Prefer `:ro` mounts for KB sources.
- Debounce writes to NAS; batch artifact flushes.

---

### X.5 Health/Latency Targets

| Operation                        | Target                       |
| -------------------------------- | ---------------------------- |
| FS change → watch detection      | ≤ 250 ms local; ≤ 750 ms SMB |
| Rule add → vector upsert         | P50 ≤ 400 ms; P95 ≤ 800 ms   |
| Context package build (≤ 1.5 MB) | ≤ 2 s                        |

---

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

---

### Y.2 MIRG ↔ Claude Code CLI

| Scenario           | Mechanism                           | Contract                                                                   |
| ------------------ | ----------------------------------- | -------------------------------------------------------------------------- |
| Generate CLI       | `GET /api/cli-command?ids=&budget=` | Returns validated `claude-code` command with `--context` & `--memory-file` |
| Execute in sidecar | `docker compose run claude-cli …`   | Shares mounts with MIRG; no copies                                         |
| Execute on host    | Read from `.context/` on Z:/C:      | Paths resolve identically; no path surgery                                 |

---

### Y.3 MIRG ↔ IDEs (Cursor/VS Code/IntelliJ)

- IDEs read working trees from `C:\\GitHub` (host).
- MIRG indexes the same tree via `/host/github` (bind).
- Conflict policy: IDE is the source of truth under `repo/`; MIRG does not mutate without explicit instruction.

