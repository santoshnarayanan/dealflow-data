import { useState } from "react";
import { queryAI } from "../services/api";

function AiQuery() {
    const [question, setQuestion] = useState("");
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;
        setLoading(true);
        setResponse(null);
        const res = await queryAI(question);
        setResponse(res);
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">🤖 AI Query</h1>

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

            {/* Response box */}
            {response && (
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner border space-y-3">
                    <p>
                        <strong className="text-gray-700">Question:</strong>{" "}
                        {response.question}
                    </p>
                    <p className="text-sm text-gray-500 break-words">
                        <strong>Cypher:</strong> {response.cypher}
                    </p>
                    <div>
                        <strong className="text-gray-700">Result:</strong>
                        <pre className="mt-2 bg-white p-3 rounded-md border text-sm overflow-x-auto">
              {JSON.stringify(response.result, null, 2)}
            </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiQuery;
