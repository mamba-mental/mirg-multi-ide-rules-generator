# Architecture Diagram

## System Overview

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[React Frontend<br/>Rules Generator UI]
        CLI[Enterprise Compliance<br/>CLI Interface]
    end
    
    subgraph "API Layer"
        API[Express.js Backend<br/>Rules API]
        CE[Compliance Engine<br/>Event-Driven]
    end
    
    subgraph "Processing Layer"
        VS[Vector Search<br/>Weaviate + LangChain]
        CL[Control Library<br/>Compliance Frameworks]
        EC[Evidence Collector<br/>Automated Collection]
        RM[Runtime Monitor<br/>Security Events]
    end
    
    subgraph "Storage Layer"
        KB[Knowledge Base<br/>Rule Documents]
        VDB[Vector Database<br/>Weaviate]
        FS[Filesystem<br/>Evidence Storage]
        AS[Audit Storage<br/>Compliance Records]
    end
    
    subgraph "External Systems"
        AI[OpenAI API<br/>Embeddings]
        MON[Monitoring Tools<br/>Prometheus/Grafana]
        CI[CI/CD Pipeline<br/>Build Systems]
    end
    
    %% User interactions
    UI --> API
    CLI --> CE
    
    %% API to processing
    API --> VS
    CE --> CL
    CE --> EC
    CE --> RM
    
    %% Processing to storage
    VS --> VDB
    VS --> KB
    CL --> AS
    EC --> FS
    RM --> AS
    
    %% External integrations
    VS --> AI
    RM --> MON
    CE --> CI
```

## Rules Generator Detailed Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant API as Express API
    participant VS as Vector Search
    participant KB as Knowledge Base
    participant VDB as Weaviate
    
    U->>UI: Select IDE, Project Type, Token Budget
    UI->>API: POST /api/rules/generate
    API->>VS: Select relevant rules
    VS->>VDB: Semantic search with filters
    VDB->>VS: Return matching documents
    VS->>API: Selected file paths
    API->>KB: Read rule files
    KB->>API: File contents
    API->>API: Generate ZIP package
    API->>UI: Return ZIP file
    UI->>U: Download rules package
```

## Enterprise Compliance Event Flow

```mermaid
sequenceDiagram
    participant RM as Runtime Monitor
    participant CE as Compliance Engine
    participant CL as Control Library
    participant EC as Evidence Collector
    participant F as Finding System
    participant R as Reporting System
    
    RM->>RM: Detect security event
    RM->>CE: Emit security-event
    CE->>CL: Map event to controls
    CL->>CE: Return control IDs
    CE->>EC: Collect evidence
    EC->>CE: Evidence collected
    CE->>F: Create findings
    F->>R: Generate compliance report
    R->>CE: Report complete
```

## Component Interaction Matrix

| Component | Rules Generator | Compliance Engine | Vector Store | Control Library | Evidence Collector |
|-----------|----------------|------------------|--------------|-----------------|-------------------|
| **React UI** | Direct API calls | - | - | - | - |
| **Express API** | Core logic | - | Semantic search | - | - |
| **Compliance Engine** | - | Event orchestrator | - | Control queries | Evidence requests |
| **Vector Store** | Rule retrieval | - | Core storage | - | - |
| **Control Library** | - | Framework mappings | - | Control definitions | - |
| **Evidence Collector** | - | Evidence storage | - | - | Evidence processing |
| **Runtime Monitor** | - | Event source | - | Control mappings | Automated collection |

## Data Models

### Rules Generator Data Model

```mermaid
erDiagram
    RULE_PACKAGE {
        string id PK
        string ide
        string projectType
        string tokenBudget
        string framework
        datetime created
        string packagePath
    }
    
    RULE_DOCUMENT {
        string id PK
        string filePath
        string fileName
        string content
        string ide
        string framework
        string category
        integer size
        datetime indexed
    }
    
    VECTOR_EMBEDDING {
        string id PK
        string documentId FK
        vector embedding
        integer chunkIndex
        integer totalChunks
        boolean isChunked
    }
    
    RULE_PACKAGE ||--o{ RULE_DOCUMENT : contains
    RULE_DOCUMENT ||--o{ VECTOR_EMBEDDING : has
```

### Enterprise Compliance Data Model

```mermaid
erDiagram
    COMPLIANCE_CONTROL {
        string id PK
        string framework
        string category
        string title
        string description
        string[] requirements
        string[] testProcedures
        boolean automationSupported
        string frequency
        string[] tags
    }
    
    CONTROL_ASSESSMENT {
        string id PK
        string controlId FK
        datetime assessmentDate
        string status
        integer effectiveness
        datetime lastTestedDate
        datetime nextAssessmentDate
        string assessor
    }
    
    FINDING {
        string id PK
        string controlId FK
        string title
        string description
        string severity
        string status
        datetime identifiedDate
        datetime dueDate
        string remediation
    }
    
    EVIDENCE {
        string id PK
        string controlId FK
        string type
        string title
        datetime collectionDate
        string collectedBy
        string location
        string hash
    }
    
    AUDIT_TRAIL {
        string id PK
        datetime timestamp
        string action
        string actor
        string resource
        string result
        json metadata
    }
    
    COMPLIANCE_CONTROL ||--o{ CONTROL_ASSESSMENT : assessed
    COMPLIANCE_CONTROL ||--o{ FINDING : has
    COMPLIANCE_CONTROL ||--o{ EVIDENCE : supported_by
    CONTROL_ASSESSMENT ||--o{ FINDING : identifies
    FINDING ||--o{ EVIDENCE : documented_by
    COMPLIANCE_CONTROL ||--o{ AUDIT_TRAIL : tracked
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        LB[Load Balancer]
        WEB[React Web App<br/>Static Files]
    end
    
    subgraph "Backend Services"
        API[Rules Generator API<br/>Express.js]
        CE[Compliance Engine<br/>Node.js]
        WS[WebSocket Server<br/>Real-time Updates]
    end
    
    subgraph "Data Layer"
        WV[Weaviate Vector DB<br/>Port 8080]
        PG[PostgreSQL<br/>Metadata Storage]
        FS[Filesystem Storage<br/>Evidence & Rules]
        RD[Redis Cache<br/>Session Storage]
    end
    
    subgraph "External Services"
        OAI[OpenAI API<br/>Embeddings]
        MON[Monitoring<br/>Prometheus]
        LOG[Logging<br/>ELK Stack]
    end
    
    %% Connections
    LB --> WEB
    LB --> API
    LB --> CE
    
    API --> WV
    API --> FS
    API --> RD
    
    CE --> PG
    CE --> FS
    CE --> WS
    
    WS --> WEB
    
    API --> OAI
    CE --> MON
    API --> LOG
    CE --> LOG
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Boundaries"
        subgraph "User Layer"
            AUTH[Authentication<br/>JWT/OAuth]
            AUTHZ[Authorization<br/>Role-Based Access]
        end
        
        subgraph "Application Layer"
            VAL[Input Validation<br/>Sanitization]
            ENC[Encryption<br/>Data at Rest/Transit]
            AUDIT[Audit Logging<br/>All Operations]
        end
        
        subgraph "Infrastructure Layer"
            NET[Network Security<br/>Firewalls/VPC]
            CONT[Container Security<br/>Docker/Kubernetes]
            MON[Security Monitoring<br/>Runtime Protection]
        end
    end
    
    AUTH --> AUTHZ
    AUTHZ --> VAL
    VAL --> ENC
    ENC --> AUDIT
    AUDIT --> NET
    NET --> CONT
    CONT --> MON
```

This architecture diagram provides a comprehensive visual representation of the system components, their interactions, and the overall structure of both the rules-generator and enterprise-compliance modules.