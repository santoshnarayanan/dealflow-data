// const API_BASE = "http://localhost:3000"; // adjust if backend changes
const API_BASE = "https://dealflow-backend-676900724267.asia-south1.run.app"; // adjust if backend changes

export async function fetchStartups() {
  const res = await fetch(`${API_BASE}/startups`);
  return res.json();
}

export async function fetchInvestors() {
  const res = await fetch(`${API_BASE}/investors`);
  return res.json();
}

export async function queryAI(question: string) {
  const res = await fetch(`${API_BASE}/ai/ai-query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return res.json();
}
