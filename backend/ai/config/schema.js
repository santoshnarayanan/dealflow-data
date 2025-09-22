// backend/ai/config/schema.js

export const graphSchema = `
Nodes:
  - Startup(name, industry, location, foundedYear)
  - Investor(name, type, location)
  - FundingRound(roundType, amount, year)

Relationships:
  - (Startup)-[:RAISED]->(FundingRound)
  - (Investor)-[:INVESTED_IN]->(FundingRound)
  - (Startup)-[:HAS_INVESTOR]->(Investor)
`;
