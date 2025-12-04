import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

import Startups from "./pages/Startups";
import Investors from "./pages/Investors";
import AiQuery from "./pages/AiQuery";
import SemanticSearch from "./pages/SemanticSearch";
import HybridAi from "./pages/HybridAi";
import AiMultiAgent from "./pages/AiMultiAgent";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Startups />} />
        <Route path="/startups" element={<Startups />} />
        <Route path="/investors" element={<Investors />} />
        <Route path="/ai-query" element={<AiQuery />} />
        <Route path="/semantic-search" element={<SemanticSearch />} />
        <Route path="/hybrid-ai" element={<HybridAi />} />
        <Route path="/ai-multi-agent" element={<AiMultiAgent />} />

        {/* Dev Tools placeholder (added in Step 5) */}
        <Route path="/dev-tools" element={<div>Developer Tools</div>} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
