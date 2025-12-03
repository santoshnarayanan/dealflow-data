# Dealflow Data Platform

Graph + Vector + Multi-Agent AI platform for startup and investor intelligence.

- **Graph DB:** Neo4j  
- **Vector DB:** Weaviate  
- **AI Layer:** LangChain Multi-Agent  
- **Frontend:** React + TypeScript  
- **Backend:** Node.js Express  
- **Deployment:** Docker + GCP Cloud Run  

Refer to **Technical-design.md** for deeper diagrams and architecture details.

---

## 📦 High-Level Architecture

<!-- Placeholder: README High-Level Diagram -->
![Phase3-HighLevel](./images/phase3-high-level.png)

---

## 🌐 Frontend
- React + TypeScript  
- Pages:
  - Startups
  - Investors
  - Semantic Search
  - AI Query (Cypher)
  - Hybrid AI (Graph + Vector)
  - Multi-Agent Query

---

## 🧠 Multi-Agent AI (Phase 3)

<!-- Placeholder: README Multi-Agent Diagram -->
![Phase3-MultiAgent-Workflow](./images/phase3-multiagent-workflow.png)

### Agents:
- **Classifier Agent** → cypher/vector/hybrid  
- **Cypher Agent** → generates Cypher & queries Neo4j  
- **Vector Agent** → nearText search on Weaviate  
- **Hybrid Agent** → parallel execution  
- **Answer Agent** → synthesis + explanation  

API Routes:
POST /ai/ai-query
POST /ai/ai-hybrid
POST /ai/multi-agent-query

---

## 🧵 Sequence Diagrams (Phase 3)

<!-- Placeholder: README Sequence Diagram -->
![Phase3-Sequence](./images/phase3-multiagent-sequence.png)

---

## 🛠 Backend

<!-- Placeholder: Backend Architecture Diagram -->
![Phase3-Backend](./images/phase3-backend-architecture.png)

- Express API  
- Neo4j Driver  
- Weaviate TS client  
- Prometheus metrics  
- Multi-agent engine  
- Health checks: `/health/*`  

---

## 🗄 Databases

### Neo4j (Graph)
- Startups  
- Investors  
- Funding Rounds  
- RAISED / INVESTED_IN / HAS_INVESTOR relationships  

### Weaviate (Vector)
- Startup vectors  
- Investor vectors  
- text2vec-openai embeddings  

<!-- Placeholder: Weaviate Schema -->
![Phase3-Weaviate-Schema](./images/phase3-weaviate-schema.png)

---

## 🚀 Phase Roadmap

### ✔ Phase 1 — Graph Backend
- Neo4j schema  
- CSV import  
- Startups + Investors REST API  

### ✔ Phase 2 — Vector Search
- Weaviate local cluster  
- Vector search endpoints  
- Hybrid vector + graph retrieval  

### ✔ Phase 3 — Multi-Agent AI
- Classifier agent  
- Cypher agent  
- Vector agent  
- Hybrid agent  
- Answer synthesis agent  
- Prometheus metrics  

### ⏳ Phase 4 — Agentic AI / LangGraph
- Stateful agents  
- Memory modules  
- Complex workflows  
- Redis cache  
- Tool orchestration  

### 🚀 Phase 5 — Production Deployment
- Cloud Run deployment  
- Frontend CDN hosting  
- CI/CD (Cloud Build)  
- Managed Neo4j Aura + Weaviate Cloud  
- Observability dashboards  

---

## 📜 License
MIT License.

