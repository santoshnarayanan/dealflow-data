import { useEffect, useState } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";
import { fetchStartups } from "../services/api";

type Startup = {
  name: string;
  industry: string;
  description: string;
};

export default function Startups() {
  const [items, setItems] = useState<Startup[]>([]);

  useEffect(() => {
    fetchStartups().then(setItems);
  }, []);

  return (
    <>
      <SectionHeader
        title="🚀 Startups"
        subtitle="Browse all startups available in Neo4j"
      />

      <Card title="Startup List">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No startups found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((s: Startup, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg shadow-sm bg-gray-50"
              >
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-sm text-gray-600">{s.industry}</p>
                <p className="text-xs text-gray-500 mt-1">{s.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
