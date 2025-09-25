# Technical Design

## 1. Overview
The Dealflow Data Platform provides a graph-based solution to manage **startups, investors, and funding rounds**.  
It combines **Neo4j** as the database, **Express.js** as the backend service layer, and an optional **AI service** powered by LangChain for natural language to Cypher query translation.

---

## 2. Architecture

![Dealflow Architecture](./images/dealflow_ai_architecture_clean.svg)

### Components
- **Frontend (planned)**  
  - React + TypeScript for user interface  

- **Backend (Express.js)**  
  - REST API endpoints (`/startups`, `/investors`, `/search`, `/ai-query`)  
  - Connects to Neo4j database  
  - Business logic in `services/` layer  

- **Database (Neo4j)**  
  - Stores startups, investors, and funding rounds as a connected graph  
  - Optimized for relationship queries  

- **AI Layer (LangChain + OpenAI)**  
  - Translates natural language questions into Cypher queries  
  - Executes against Neo4j and returns structured answers  

---

## 3. Data Model

### Node Labels
- **Startup**
  - Properties: `id`, `name`, `industry`, `foundedYear`
- **Investor**
  - Properties: `id`, `name`, `type`, `location`
- **FundingRound**
  - Properties: `id`, `roundType`, `amount`, `year`

### Relationships
- `(Startup)-[:RAISED]->(FundingRound)`
- `(Investor)-[:INVESTED_IN]->(FundingRound)`

![Nodes and Relationships](./images/visualisation.png)
---

## 4. Backend Modules
```bash
backend/
├── ai/
│ ├── config/ # Graph schema definition for AI queries
│ ├── routes/ # /ai-query endpoint
│ └── services/ # LangChain integration
├── config/neo4j.js # Neo4j driver setup
├── routes/ # Express route definitions
├── services/ # Startup & Investor business logic
└── middlewares/ # Error handling
```

- **routes/**  
  Defines REST endpoints (`/startups`, `/investors`, `/search`).  

- **services/**  
  Contains business logic and Cypher queries (e.g., `startupService.js`, `investorService.js`).  

- **ai/**  
  Dedicated LangChain integration (`langchainService.js`) + schema for Cypher generation.  

- **middlewares/**  
  Common middleware such as error handling.  

---

## 5. Request Flow

1. User sends request (`/startups` or AI query).  
2. Express route calls corresponding service.  
3. Service executes Cypher query via Neo4j driver.  
4. Results returned to client.  
![Sequence diagram](./images/sequence-diagram.png)

## 8. LangChain Usage

LangChain is integrated into the backend for **AI-driven query generation**.  

### Workflow
1. User submits a natural language question via `/ai-query`.
2. LangChain uses the **graph schema definition (`ai/config/schema.js`)** to understand available node labels and relationships.
3. It builds a Cypher query using its **CypherQAChain** module.
4. The query is executed on Neo4j.
5. Results are returned as JSON.

### Example
Question:  
> "Which investors participated in Series A rounds?"

Generated Cypher:  
```cypher
MATCH (i:Investor)-[:INVESTED_IN]->(f:FundingRound {roundType:'Series A'})
RETURN DISTINCT i.name;