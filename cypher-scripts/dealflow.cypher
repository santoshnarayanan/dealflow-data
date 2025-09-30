LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/santoshnarayanan/dealflow-data/main/data/startups_extended.csv' AS row
MERGE (s:Startup {name: row.name})
SET s.industry = row.industry,
    s.founded_year = toInteger(row.founded);

LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/santoshnarayanan/dealflow-data/main/data/investors_extended.csv' AS row
MERGE (i:Investor {name: row.name});

LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/santoshnarayanan/dealflow-data/main/data/investments_extended.csv' AS row
MERGE (f:FundingRound {id: row.funding_id})
SET f.round = row.round,
    f.year = toInteger(row.year),
    f.amount = toFloat(row.amount);


// Relationships: Investor → Startup
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/santoshnarayanan/dealflow-data/main/data/investments_extended.csv' AS row
MATCH (i:Investor {name: row.investor})
MATCH (s:Startup {name: row.startup})
MERGE (i)-[:INVESTED_IN]->(s);

// Relationships: Startup → Investor (alias for AIQuery)
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/santoshnarayanan/dealflow-data/main/data/investments_extended.csv' AS row
MATCH (s:Startup {name: row.startup})
MATCH (i:Investor {name: row.investor})
MERGE (s)-[:HAS_INVESTOR]->(i);

// Relationships: Startup → FundingRound
LOAD CSV WITH HEADERS FROM 'https://raw.githubusercontent.com/santoshnarayanan/dealflow-data/main/data/investments_extended.csv' AS row
MATCH (s:Startup {name: row.startup})
MATCH (f:FundingRound {id: row.funding_id})
MERGE (s)-[:RAISED]->(f);
