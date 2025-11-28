
# Dealflow Data Platform

- A graph-based platform to manage **startups, investors, and funding rounds** using **Neo4j** and an **Express.js** backend.  
- Integrates **LangChain** to allow natural language questions (e.g., *“Which investors funded RoboWorks?”*) to be automatically translated into **Cypher queries**.  
- Includes **Weaviate** for vector search (semantic + hybrid).  
- Refer to the full **Technical Design** document in `Technical-design.md`.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📑 Table of Contents
- [Dealflow Data Platform](#dealflow-data-platform)
  - [📑 Table of Contents](#-table-of-contents)
  - [🚀 Setup Guide](#-setup-guide)
    - [1. Prerequisites](#1-prerequisites)
    - [2. Clone Repository](#2-clone-repository)
    - [3. Install Dependencies](#3-install-dependencies)
    - [4. Configure Environment Variables](#4-configure-environment-variables)
  - [🧠 Vector DB Setup (Weaviate)](#-vector-db-setup-weaviate)
    - [1. Start Weaviate via Docker Compose](#1-start-weaviate-via-docker-compose)
    - [2. Verify Weaviate](#2-verify-weaviate)
    - [3. Create Schema](#3-create-schema)
    - [4. Ingest Data](#4-ingest-data)
    - [🕹 Explore Data (GUI Options)](#-explore-data-gui-options)
  - [🥇 Run Backend](#-run-backend)
    - [Your API is available at:](#your-api-is-available-at)
  - [📥 Data Import Guide (Neo4j)](#-data-import-guide-neo4j)
    - [1. Place CSV Files](#1-place-csv-files)
    - [2. Import Commands (Run in Neo4j Browser)](#2-import-commands-run-in-neo4j-browser)
  - [📋 Query Checklist (Cypher)](#-query-checklist-cypher)
    - [🏢 Startups](#-startups)
    - [💼 Investors](#-investors)
    - [💰 Funding Rounds](#-funding-rounds)
  - [🌐 API Usage](#-api-usage)
    - [1. List Startups](#1-list-startups)
    - [2. List Investors](#2-list-investors)
    - [3. Search by Industry](#3-search-by-industry)
    - [4. AI Query](#4-ai-query)
  - [✨ Features](#-features)
  - [🛠 Tech Stack](#-tech-stack)
  - [🤝 Contributing](#-contributing)
  - [📜 License](#-license)
  - [🙏 Acknowledgements](#-acknowledgements)
  - [📌 Notice](#-notice)

---

## 🚀 Setup Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Neo4j Aura** or **Neo4j Desktop (v5.x)**
- **npm** or **yarn**

### 2. Clone Repository
```bash
git clone https://github.com/your-org/dealflow-data.git
cd dealflow-data/backend
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create `.env` file in `backend/`:

```
NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
PORT=3000
AI_PORT=3001
OPENAI_API_KEY=your_openai_key
```

---

## 🧠 Vector DB Setup (Weaviate)

### 1. Start Weaviate via Docker Compose
```bash
docker compose -f services/docker-compose-weaviate.yml up -d
```

### 2. Verify Weaviate
```bash
curl http://localhost:8080/v1/meta
```

### 3. Create Schema
```bash
curl -X POST http://localhost:8080/v1/schema \
  -H "Content-Type: application/json" \
  -d @startup.json

curl -X POST http://localhost:8080/v1/schema \
  -H "Content-Type: application/json" \
  -d @investor.json
```

### 4. Ingest Data
```bash
node backend/ingest/weaviateIngest.js
```

### 🕹 Explore Data (GUI Options)
- **Weaviate Studio Desktop App**
- **Weaviate VS Code Extension**

Inspect:
- Objects  
- Embeddings  
- Schema  
- nearText / nearVector / Hybrid Queries  

---

## 🥇 Run Backend

```bash
npm start
```

### Your API is available at:
```
http://localhost:3000/startups
http://localhost:3000/investors
http://localhost:3000/search/startups
http://localhost:3000/ai/ai-query
```

---

## 📥 Data Import Guide (Neo4j)

### 1. Place CSV Files
Copy CSVs into Neo4j `import/` directory:

```
neo4j/import/startups.csv
neo4j/import/investors.csv
neo4j/import/funding_rounds.csv
neo4j/import/relationships.csv
```

### 2. Import Commands (Run in Neo4j Browser)

```cypher
// Import Startups
LOAD CSV WITH HEADERS FROM 'file:///startups.csv' AS row
MERGE (s:Startup {id: row.id})
SET s.name = row.name, s.industry = row.industry, s.foundedYear = toInteger(row.foundedYear);

// Import Investors
LOAD CSV WITH HEADERS FROM 'file:///investors.csv' AS row
MERGE (i:Investor {id: row.id})
SET i.name = row.name, i.type = row.type, i.location = row.location;

// Import Funding Rounds
LOAD CSV WITH HEADERS FROM 'file:///funding_rounds.csv' AS row
MERGE (f:FundingRound {id: row.id})
SET f.roundType = row.roundType, f.amount = toFloat(row.amount), f.year = toInteger(row.year);

// Import Relationships
LOAD CSV WITH HEADERS FROM 'file:///relationships.csv' AS row
MATCH (s:Startup {id: row.startupId})
MATCH (f:FundingRound {id: row.fundingRoundId})
MERGE (s)-[:RAISED]->(f);

MATCH (i:Investor {id: row.investorId})
MATCH (f:FundingRound {id: row.fundingRoundId})
MERGE (i)-[:INVESTED_IN]->(f);
```

---

## 📋 Query Checklist (Cypher)

### 🏢 Startups
```cypher
MATCH (s:Startup {industry: 'Fintech'}) RETURN s;

MATCH (s:Startup)-[:RAISED]->(f:FundingRound)
WHERE f.amount > 10000000
RETURN s.name, f.amount;

MATCH (s:Startup)-[:RAISED]->(f:FundingRound {roundType:'Series A', year:2023})
RETURN s.name;
```

### 💼 Investors
```cypher
MATCH (i:Investor)-[:INVESTED_IN]->(f)<-[:RAISED]-(s:Startup {name:'FinAI'})
RETURN i.name;

MATCH (i:Investor)-[:INVESTED_IN]->(f)<-[:RAISED]-(s:Startup {industry:'Healthcare'})
RETURN DISTINCT i.name;

MATCH (i:Investor)-[:INVESTED_IN]->(f:FundingRound {roundType:'Series B'})
RETURN DISTINCT i.name;
```

### 💰 Funding Rounds
```cypher
MATCH (s:Startup)-[:RAISED]->(f:FundingRound {year:2023})
RETURN s.name, f.roundType, f.amount;

MATCH (i:Investor)-[:INVESTED_IN]->(f:FundingRound {roundType:'Series A'})
RETURN i.name;
```

---

## 🌐 API Usage

### 1. List Startups
```bash
curl http://localhost:3000/startups
```

### 2. List Investors
```bash
curl http://localhost:3000/investors
```

### 3. Search by Industry
```bash
curl "http://localhost:3000/search/startups?industry=Fintech"
```

### 4. AI Query
```bash
curl -X POST http://localhost:3000/ai/ai-query \
  -H "Content-Type: application/json" \
  -d '{"question": "Which investors funded RoboWorks?"}'
```

---

## ✨ Features

- Graph-based model for startups, investors, and funding rounds  
- Semantic search using **Weaviate vector embeddings**  
- Hybrid search combining BM25 + vector similarity  
- AI-powered **natural language → Cypher** translator  
- RAG pipeline integrating Neo4j + Weaviate + OpenAI  
- REST API endpoints for data access & search  
- CSV import pipeline for Neo4j  
- Deployable on **GCP Cloud Run**  
- Extendable domain model (Founders, Advisors, Accelerators, etc.)

---

## 🛠 Tech Stack

- **Frontend:** React + TypeScript (Phase 3)  
- **Backend:** Node.js (Express.js)  
- **Graph DB:** Neo4j Aura / Desktop  
- **Vector DB:** Weaviate (text2vec-openai)  
- **AI Layer:** LangChain + OpenAI  
- **Deployment:** Docker + Cloud Run  
- **Dev Tools:** Cursor IDE, VS Code Weaviate plugin  

---

## 🤝 Contributing
1. Fork the repo  
2. Create a feature branch  
3. Commit your changes  
4. Push to your branch  
5. Open a Pull Request  

Refer to `Technical-design.md` before major architectural changes.

---

## 📜 License
Licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements
This project uses:

- LangChain (MIT)  
- Neo4j (GPL v3 / Commercial)  
- React (MIT)  
- Node.js (MIT)  
- Weaviate (BSD-3-Clause)

Special thanks to open‑source contributors.

---

## 📌 Notice

Copyright © 2025  
**Santosh Narayanan**

Source repository:  
https://github.com/santoshnarayanan/dealflow-data