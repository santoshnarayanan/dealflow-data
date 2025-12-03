// backend/ai/services/multiAgentService.js

import { ChatOpenAI } from "@langchain/openai";
import weaviate from "weaviate-ts-client";
import { askGraph } from "./langchainService.js";
import { logger } from "../../logger.js";
import { agentDuration } from "../../metrics/metrics.js";

// ------ LLM + Weaviate setup ------

// Low-temperature for deterministic tools / reasoning
const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Weaviate client (same as ingest script)
const weaviateClient = weaviate.client({
    scheme: "http",
    host: "localhost:8080", // adjust if you proxy Weaviate
    headers: {
        "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY,
    },
});

// ------ Agent 1: Query Classifier ------

async function classifyRoute(question) {
    logger.info({ question }, "🧭 Classifier: routing decision");
    logger.debug({ traceId, question }, "🧭 [Classifier] Deciding route...");
    const classifierTimerEnd = agentDuration.startTimer({ agent: "classifier" });
    const systemPrompt = `
You are a routing assistant for an AI system that has:
- A Neo4j graph with structured entities (Startups, Investors, FundingRounds).
- A Weaviate vector database with semantic documents for Startups and Investors.

Decide how to answer a user question.

Return ONLY one word, lowercase, no punctuation:
- "cypher"  → when question is best answered from graph structure
              (e.g., relationships, joins, counts, specific entities).
- "vector"  → when question is fuzzy, descriptive, or more about semantics / text.
- "hybrid"  → when both graph structure and semantic text are useful.
  `;

    const msg = await llm.invoke([
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
    ]);

    const raw = typeof msg.content === "string" ? msg.content : String(msg.content);
    const route = raw.trim().toLowerCase();

    logger.debug({ traceId, route }, "🧭 [Classifier] Route chosen");


    if (route.startsWith("cypher")) { classifierTimerEnd(); return "cypher"; }
    if (route.startsWith("vector")) { classifierTimerEnd(); return "vector"; }
    if (route.startsWith("hybrid")) { classifierTimerEnd(); return "hybrid"; }

    // Fallback – safe default
    classifierTimerEnd();
    return "cypher";
}

// ------ Agent 2: Cypher / Graph Agent (reuses askGraph) ------

async function runCypherAgent(question) {
    logger.debug({ traceId, question }, "📘 [Cypher] Generating Cypher...");
    const cypherTimerEnd = agentDuration.startTimer({ agent: "cypher" });
    try {
        const { cypher, result, rawOutput } = await askGraph(question);
        logger.info({ question }, "🔍 Vector search requested");
        logger.debug({ traceId, cypher }, "📘 [Cypher] Cypher generated");

        return {
            ok: true,
            cypher,
            result,
            rawOutput,
        };
    } catch (err) {
        logger.error({ err }, "❌ Vector agent error");
        console.error("❌ Cypher agent error:", err);
        return {
            ok: false,
            error: err.message || "Cypher agent failed",
        };
    } finally {
        cypherTimerEnd();
    }
}

// ------ Agent 3: Vector / Weaviate Agent ------

async function runVectorAgent(question) {
    async function runVectorAgent(question) {
        logger.debug({ traceId, question }, "🔍 [Vector] Running semantic search...");
        const vectorTimerEnd = agentDuration.startTimer({ agent: "vector" });
        try {
            logger.info({ question }, "🔍 Vector search requested");

            // Query Startup class
            const startupRes = await weaviateClient.graphql
                .get()
                .withClassName("Startup")
                .withFields("name industry description")
                .withNearText({ concepts: [question] })
                .withLimit(5)
                .do();

            // Query Investor class
            const investorRes = await weaviateClient.graphql
                .get()
                .withClassName("Investor")
                .withFields("name type description")
                .withNearText({ concepts: [question] })
                .withLimit(5)
                .do();

            const startups =
                startupRes.data?.Get?.Startup ??
                startupRes.data?.Get?.startup ?? // depending on schema casing
                [];

            const investors =
                investorRes.data?.Get?.Investor ??
                investorRes.data?.Get?.investor ?? // depending on schema casing
                [];

            logger.debug(
                { traceId, startupCount: startups.length, investorCount: investors.length },
                "🔍 [Vector] Vector search complete"
            );


            return {
                ok: true,
                startups,
                investors,
                rawStartup: startupRes,
                rawInvestor: investorRes,
            };
        } catch (err) {
            console.error("❌ Vector agent error:", err);
            logger.error({ err }, "❌ Vector agent error");
            logger.error({ traceId, err }, "❌ [Vector] Search failed");

            return {
                ok: false,
                error: err.message || "Vector agent failed",
            };
        } finally {
            vectorTimerEnd();
        }
    }
    // ------ Agent 4: Answer / Synthesis Agent ------

    async function runAnswerAgent({ question, route, cypherData, vectorData }) {
        const llmStart = Date.now();

        const answerTimerEnd = agentDuration.startTimer({ agent: "answer" });

        const systemPrompt = `
You are a senior AI analyst for an "AI-Augmented Dealflow Data Platform".

You will receive:
- The original user question.
- The routing decision: cypher, vector, or hybrid.
- Optional graph query result from Neo4j (cypherData.result).
- Optional semantic retrieval result from Weaviate (vectorData.startups / vectorData.investors).

Your job:
1. Produce a clear, concise answer for the user.
2. If helpful, mention specific startups, investors, industries, or relationships.
3. If data is missing or partial, say so explicitly.
4. Provide a short explanation of how you used the graph / vector data.

Respond in JSON with exactly these fields:
{
  "answer": "final natural language answer",
  "explanation": "1-3 sentence description of what data sources were used"
}
  `;

        const payload = {
            question,
            route,
            cypherData: cypherData?.ok ? cypherData.result : null,
            vectorData: vectorData?.ok
                ? {
                    startups: vectorData.startups,
                    investors: vectorData.investors,
                }
                : null,
        };

        const msg = await llm.invoke([
            { role: "system", content: systemPrompt },
            {
                role: "user",
                content: JSON.stringify(payload, null, 2),
            },
        ]);

        const llmDuration = Date.now() - llmStart;

        if (llmDuration > PERF_THRESHOLDS.llmMs) {
            logger.warn(
                { llmDuration, route },
                "⚠️ Slow LLM response detected"
            );
        }


        const text =
            typeof msg.content === "string" ? msg.content : String(msg.content);

        // Try to parse JSON; if it fails, wrap as answer only
        try {
            const parsed = JSON.parse(text);
            return {
                answer: parsed.answer ?? text,
                explanation:
                    parsed.explanation ??
                    "Used available graph/vector data to construct the answer.",
            };
        } catch {
            return {
                answer: text,
                explanation:
                    "Model returned non-JSON text; treated entire response as the answer.",
            };
        } finally {
            answerTimerEnd();
        }
    }
}

export async function runMultiAgentQuery(question, traceId) {
    // 1. Decide route
    const agentStart = Date.now();

    logger.info({ traceId, question }, "📌 Orchestrator started");
    const endClassifier = agentDuration.startTimer({ agent: "classifier" });

    const route = await classifyRoute(question);
    endClassifier();
    console.log("🧭 Route decision:", route);

    // 2. Run relevant agents
    let cypherData = null;
    let vectorData = null;

    if (route === "cypher") {
        const endCypher = agentDuration.startTimer({ agent: "cypher" });
        cypherData = await runCypherAgent(question);
        endCypher();
    } else if (route === "vector") {
        const endVector = agentDuration.startTimer({ agent: "vector" });
        vectorData = await runVectorAgent(question);
        endVector();
    } else if (route === "hybrid") {
        // run both in parallel
        [cypherData, vectorData] = await Promise.all([
            runCypherAgent(question),
            runVectorAgent(question),
        ]);
    }

    // 3. Synthesize answer
    const endAnswer = agentDuration.startTimer({ agent: "answer" });
    const { answer, explanation } = await runAnswerAgent({
        question,
        route,
        cypherData,
        vectorData,
    });
    endAnswer();

    const agentDuration = Date.now() - agentStart;

    if (agentDuration > PERF_THRESHOLDS.agentMs) {
        logger.warn(
            { agentDuration, route },
            "⚠️ Slow Multi-Agent orchestration detected"
        );
    }


    logger.info(
        { route, hasCypher: !!cypherData, hasVector: !!vectorData },
        "🤖 Multi-agent orchestration completed"
    );

    logger.info(
        { traceId, route },
        "📌 Orchestrator finished"
    );



    // 4. Return structured result to API/Frontend
    return {
        traceId,
        question,
        route,
        answer,
        explanation,
        cypher: cypherData?.cypher ?? null,
        cypherResult: cypherData?.ok ? cypherData.result : null,
        cypherError: cypherData && !cypherData.ok ? cypherData.error : null,
        vectorResult:
            vectorData?.ok
                ? {
                    startups: vectorData.startups,
                    investors: vectorData.investors,
                }
                : null,
        vectorError: vectorData && !vectorData.ok ? vectorData.error : null,
    };
}

