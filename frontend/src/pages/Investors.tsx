import { useEffect, useState } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import Card from "../components/ui/Card";
import { fetchInvestors } from "../services/api";

interface Investor {
  name: string;
  type: string;
  description: string;
}

export default function Investors() {
  const [items, setItems] = useState<Investor[]>([]);

  useEffect(() => {
    fetchInvestors().then(setItems);
  }, []);

  return (
    <>
      <SectionHeader
        title="💼 Investors"
        subtitle="Explore the investor network from Neo4j"
      />

      <Card title="Investor List">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No investors found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((i, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg shadow-sm bg-gray-50"
              >
                <h3 className="font-semibold">{i.name}</h3>
                <p className="text-sm">{i.type}</p>
                <p className="text-xs text-gray-500">{i.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
