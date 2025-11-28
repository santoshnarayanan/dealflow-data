import { useState, FormEvent } from "react";
import { queryAI } from "../services/api";

function AiQuery() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await queryAI(question);
      setResponse(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const graphResult = response?.graphResult ?? response?.result;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-2">AI → Cypher → Neo4j</h1>
      <p className="text-gray-600 mb-4">
        Ask a natural language question. The backend will generate a Cypher
        query and run it on the Neo4j graph.
      </p>

      {/* Input box */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 items-center bg-white p-4 rounded-xl shadow-md"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask me about startups or investors..."
          className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Response box */}
      {response && (
        <div className="bg-gray-50 p-6 rounded-xl shadow-inner border space-y-4">
          <p>
            <strong className="text-gray-700">Question:</strong>{" "}
            {response.question}
          </p>

          <p className="text-sm text-gray-700 break-words">
            <strong>Cypher:</strong>{" "}
            <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
              {response.cypher}
            </span>
          </p>

          {graphResult && (
            <div>
              <strong className="text-gray-700">Graph Result:</strong>
              <pre className="mt-2 bg-white p-3 rounded-md border text-sm overflow-x-auto">
                {JSON.stringify(graphResult, null, 2)}
              </pre>
            </div>
          )}

          {response.rawModelOutput && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-500">
                Show raw model output
              </summary>
              <pre className="mt-2 bg-white p-3 rounded-md border text-xs overflow-x-auto">
                {response.rawModelOutput}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default AiQuery;