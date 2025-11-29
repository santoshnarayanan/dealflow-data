// frontend/src/App.tsx

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Startups from "./pages/Startups";
import Investors from "./pages/Investors";
import AiQuery from "./pages/AiQuery";
import SemanticSearch from "./pages/SemanticSearch";
import HybridAi from "./pages/HybridAi";
import NotFound from "./pages/NotFound";
import AiMultiAgent from "./pages/AiMultiAgent";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Startups />} />
        <Route path="/investors" element={<Investors />} />
        <Route path="/ai-query" element={<AiQuery />} />
        <Route path="/semantic-search" element={<SemanticSearch />} />
        <Route path="/hybrid-ai" element={<HybridAi />} />
        <Route path="/ai-multi-agent" element={<AiMultiAgent />} />
        {/* Catch-all for unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
