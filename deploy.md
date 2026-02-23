# 🚀 Dealflow AI – Local Deployment Guide (Windows 11)

This document provides step‑by‑step instructions to run the full Dealflow AI system locally.

---

# 🧩 Architecture Overview

The system consists of:

- **Neo4j** – Graph Database
- **Weaviate** – Vector Database (OpenAI embeddings)
- **Redis** – Caching (via Docker)
- **Express (Node.js)** – Backend API
- **React + Vite** – Frontend
- **LangChain** – AI orchestration

---

# ✅ Prerequisites

Make sure the following are installed:

- Node.js (v18+ recommended)
- Docker Desktop (running)
- Neo4j Desktop (or Neo4j Docker)
- Git

---

# 📁 Project Structure

```
dealflow-data/
│
├── backend/
├── frontend/
├── services/
│   ├── docker-compose.dev.yml
│   └── .env
├── .env  (backend)
├── startup.json
├── investor.json
```

---

# 🔐 1. Configure Environment Variables

## Backend `.env` (Project Root)

```
NEO4J_URI=neo4j://127.0.0.1:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j

PORT=3000

OPENAI_API_KEY=sk-your-openai-key
```

---

## Services `.env` (Inside `/services` Folder)

```
OPENAI_API_KEY=sk-your-openai-key
```

Both keys must match.

---

# 🧠 2. Start Neo4j

If using Neo4j Desktop:

1. Open Neo4j Desktop
2. Start your database

Verify:

```
http://localhost:7474
```

---

# 🐳 3. Start Weaviate + Redis

Open terminal and navigate to services:

```
cd services
```

Start containers:

```
docker-compose -f docker-compose.dev.yml up -d
```

If restarting cleanly:

```
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d --force-recreate
```

Verify Weaviate:

```
http://localhost:8080/v1/meta
```

---

# 🧱 4. Create Weaviate Schema (First Time Only)

From project root:

```
curl -X POST http://localhost:8080/v1/schema -H "Content-Type: application/json" --data-binary "@startup.json"
```

```
curl -X POST http://localhost:8080/v1/schema -H "Content-Type: application/json" --data-binary "@investor.json"
```

Verify schema:

```
http://localhost:8080/v1/schema
```

---

# 🧠 5. Start Backend

Open new terminal:

```
cd backend
```

Install dependencies (first time only):

```
npm install
```

Start backend:

```
npm start
```

Verify:

```
http://localhost:3000/health
```

---

# 🎨 6. Start Frontend

Open another terminal:

```
cd frontend
```

Install dependencies (first time only):

```
npm install
```

Start development server:

```
npm run dev
```

Open in browser:

```
http://localhost:5173
```

---

# 🔎 7. Test API Endpoints

### Graph API
```
http://localhost:3000/startups
```

### Vector Search
```
http://localhost:3000/vector/startups?q=fintech
```

### Health Check
```
http://localhost:3000/health
```

---

# 🛑 Stop Services

Stop Weaviate + Redis:

```
cd services
docker-compose -f docker-compose.dev.yml down
```

Stop backend or frontend:

```
Ctrl + C
```

---

# 🔁 Startup Order (Important)

Always start in this order:

1. Neo4j
2. Docker (Weaviate + Redis)
3. Backend
4. Frontend

---

# 🛠 Troubleshooting

## 401 OpenAI Error
- Verify correct API key
- Restart Docker with `--force-recreate`
- Ensure key exists in both `.env` files

## 500 Vector Error
- Ensure schema exists
- Ensure Weaviate running
- Check backend logs

## Port Conflicts

| Service | Port |
|----------|------|
| Backend | 3000 |
| Weaviate | 8080 |
| Neo4j Browser | 7474 |
| Neo4j Bolt | 7687 |
| Frontend | 5173 |

---

# 🎯 System Ready Checklist

- `/health` returns OK
- `/startups` returns graph data
- `/vector/startups` returns JSON (even empty array is fine)
- Frontend loads and queries successfully

---

🚀 Your Dealflow AI system is now ready for development and testing.

