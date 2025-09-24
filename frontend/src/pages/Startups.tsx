import { useEffect, useState } from "react";
import { fetchStartups } from "../services/api";

function Startups() {
    const [startups, setStartups] = useState<any[]>([]);

    useEffect(() => {
        fetchStartups().then(setStartups);
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">🚀 Startups</h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {startups.map((s, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition"
                    >
                        <h2 className="text-xl font-semibold text-gray-800">
                            {s.name || "Unnamed Startup"}
                        </h2>
                        <p className="text-gray-500">{s.industry || "Industry not specified"}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Startups;
