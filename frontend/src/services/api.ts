// frontend/src/services/api.ts

const API_BASE = "http://localhost:3000"; // adjust if backend changes
// const API_BASE = "https://dealflow-backend-676900724267.asia-south1.run.app";

export async function fetchStartups() {
  const res = await fetch(`${API_BASE}/startups`);
  if (!res.ok) throw new Error("Failed to fetch startups");
  return res.json();
}

export async function fetchInvestors() {
  const res = await fetch(`${API_BASE}/investors`);
  if (!res.ok) throw new Error("Failed to fetch investors");
  return res.json();
}

export async function queryAI(question: string) {
  const res = await fetch(`${API_BASE}/ai/ai-query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("AI graph query failed");
  return res.json();
}

export async function queryRag(question: string) {
  const res = await fetch(`${API_BASE}/ai/ai-rag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("AI RAG query failed");
  return res.json();
}

export async function queryHybrid(question: string) {
  const res = await fetch(`${API_BASE}/ai/ai-hybrid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error("AI hybrid query failed");
  return res.json();
}

export async function vectorSearchStartups(q: string) {
  const res = await fetch(
    `${API_BASE}/vector/startups?` + new URLSearchParams({ q })
  );
  if (!res.ok) throw new Error("Vector search for startups failed");
  return res.json();
}

export async function vectorSearchInvestors(q: string) {
  const res = await fetch(
    `${API_BASE}/vector/investors?` + new URLSearchParams({ q })
  );
  if (!res.ok) throw new Error("Vector search for investors failed");
  return res.json();
}

export async function queryMultiAgent(question: string) {
  const res = await fetch(`${API_BASE}/ai/multi-agent-query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Multi-agent API error (${res.status}): ${text || res.statusText}`
    );
  }

  return res.json();
}