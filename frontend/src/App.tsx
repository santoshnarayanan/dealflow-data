import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Startups from "./pages/Startups";
import Investors from "./pages/Investors";
import AiQuery from "./pages/AiQuery";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Startups />} />
                <Route path="/investors" element={<Investors />} />
                <Route path="/ai-query" element={<AiQuery />} />
                {/* Catch-all for unknown routes */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Layout>
    );
}

export default App;
