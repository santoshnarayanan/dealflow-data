import { useState } from "react";
import { queryAI } from "../services/api";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";

export default function AiQuery() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<unknown | null>(null);

  const ask = async () => {
    if (!question.trim()) return;
    const res = await queryAI(question);
    setResult(res);
  };

  return (
    <>
      <SectionHeader
        title="🧠 AI → Cypher Query"
        subtitle="LLM translates your question to Cypher and queries Neo4j"
      />

      <Card title="Ask a Question">
        <div className="flex gap-2">
          <input
            className="flex-grow border rounded-lg px-3 py-2"
            placeholder="e.g. Which investors funded Stripe?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            onClick={ask}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Ask
          </button>
        </div>
      </Card>

      {result && (
        <Card title="Response" className="mt-4">
          <p className="text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </p>
        </Card>
      )}
    </>
  );
}
