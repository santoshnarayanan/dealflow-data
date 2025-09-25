# Dealflow Data Platform

- A graph-based platform to manage **startups, investors, and funding rounds** using **Neo4j** and **Express.js** backend.
- This project integrates **LangChain** to allow **natural language questions** (e.g., *“Which investors funded RoboWorks?”*) to be automatically translated into **Cypher queries**.
- Also refer **Technical design document** in file **Technical-design.md** 

---

## 📑 Table of Contents
- [🚀 Setup Guide](#-setup-guide)
- [📥 Data Import Guide (Neo4j)](#-data-import-guide-neo4j)
- [📋 Query Checklist (Cypher)](#-query-checklist-cypher)
  - [🏢 Startups](#-startups)
  - [💼 Investors](#-investors)
  - [💰 Funding Rounds](#-funding-rounds)
- [🌐 API Usage](#-api-usage)

---

## 🚀 Setup Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended)  
- **Neo4j Aura** or **Neo4j Desktop** (v5.x)  
- **npm** or **yarn**

### 2. Clone Repo
```bash
git clone https://github.com/your-org/dealflow-data.git
cd dealflow-data/backend
```
### 3. Install Dependencies
```bash
npm install
```

### 4. Configure environment
```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
PORT=3000
```
### 5.  Run Backend
```bash
npm start
```

### 6.  Your API should now be available at:
```bash
- http://localhost:3000/startups
- http://localhost:3000/investors
```

## 📥 Data Import Guide (Neo4j)

### 1. Place CSVs

Copy your CSVs into Neo4j import/ directory. Example:
```bash
neo4j/import/startups.csv
neo4j/import/investors.csv
neo4j/import/funding_rounds.csv
neo4j/import/relationships.csv
```

### 2. Import Commands

Run in Neo4j Browser 
```bash
http://localhost:7474
```
- cypher script

```bash
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

## 📋 Query Checklist (Cypher)
### 🏢 Startups
- cypher
```bash
// Show all startups in fintech industry
MATCH (s:Startup {industry: 'Fintech'}) RETURN s;

// Which startups raised more than $10M
MATCH (s:Startup)-[:RAISED]->(f:FundingRound)
WHERE f.amount > 10000000
RETURN s.name, f.amount;

// Startups that raised Series A in 2023
MATCH (s:Startup)-[:RAISED]->(f:FundingRound {roundType:'Series A', year:2023})
RETURN s.name;
```

### 💼 Investors
- cypher
```bash
// Which investors funded FinAI
MATCH (i:Investor)-[:INVESTED_IN]->(f:FundingRound)<-[:RAISED]-(s:Startup {name:'FinAI'})
RETURN i.name;

// Investors who backed healthcare startups
MATCH (i:Investor)-[:INVESTED_IN]->(f)<-[:RAISED]-(s:Startup {industry:'Healthcare'})
RETURN DISTINCT i.name;

// Investors in Series B
MATCH (i:Investor)-[:INVESTED_IN]->(f:FundingRound {roundType:'Series B'})
RETURN DISTINCT i.name;
```
### 💰 Funding Rounds
- cypher
```bash
// Funding rounds in 2023
MATCH (s:Startup)-[:RAISED]->(f:FundingRound {year:2023})
RETURN s.name, f.roundType, f.amount;

// Series A investors
MATCH (i:Investor)-[:INVESTED_IN]->(f:FundingRound {roundType:'Series A'})
RETURN i.name;

```

## 🌐 API Usage
### 1. List Startups
```bash
curl http://localhost:3000/startups
```
- response json
```bash
[
  { "name": "FinAI", "industry": "Fintech", "foundedYear": 2022 },
  { "name": "MediCareX", "industry": "Healthcare", "foundedYear": 2021 }
]
```

### 2. List Investors
```bash
curl http://localhost:3000/investors
```

### 3. Search Startups by Industry
```bash
curl "http://localhost:3000/search/startups?industry=Fintech"
```

### 4. AI Query (LangChain)
```bash
curl -X POST http://localhost:3000/ai-query \
  -H "Content-Type: application/json" \
  -d '{"question": "Which investors funded RoboWorks?"}'
```

