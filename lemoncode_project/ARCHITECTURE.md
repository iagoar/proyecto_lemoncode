# Architecture

```mermaid
flowchart LR
    browser["User's browser"]

    subgraph compose["Docker Compose"]
        web["web · TanStack Start / Nitro<br/>React client + server functions<br/>:3000"]
        api["api · json-server<br/>REST API :3001"]
        dbvol[("api-db volume<br/>db/db.json")]
        rustfs["rustfs · S3-compatible object storage<br/>S3 :9000 · console :9001"]
        objvol[("rustfs-data volume")]
        seed["db/seed.json"]
        ensure["scripts/ensure-db.mjs"]

        subgraph app["Application layers"]
            routes["File-based routes<br/>client + admin"]
            features["Feature UI and layouts"]
            adapters["src/lib/api<br/>REST adapters + server functions"]
            routes --> features --> adapters
        end
        
    end

    subgraph Google["Google Services"]
        google["Google Identity / OAuth APIs"]
        gemini["Google Gemini API"]
    end

    browser -->|"HTTP :3000 · app and server functions"| web
    browser -->|"REST · VITE_API_URL (:3001)"| api
    api --> dbvol
    seed --> ensure
    ensure -->|"initialize / update db.json"| dbvol

    web -->|"signed S3 PUT · upload image"| rustfs

    web -->|"recommendation request"| gemini
    browser -->|"OAuth token request"| google
    web -->|"authenticate"| google
    rustfs --> objvol    
    browser -->|"load image from public S3 URL"| rustfs

    
    web -->|"hosts"| app

    classDef external fill:#f4f4f5,stroke:#71717a,color:#18181b
    classDef storage fill:#eff6ff,stroke:#3b82f6,color:#172554
    class google,gemini,browser external
    class dbvol,objvol storage
```

The browser calls json-server directly for application data. Image uploads,
Google token verification, and optional AI recommendations run through
TanStack Start server functions; image downloads are served directly from the
public RustFS bucket.
