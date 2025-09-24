import { useEffect, useState } from "react";
import { fetchInvestors } from "../services/api";

function Investors() {
    const [investors, setInvestors] = useState<any[]>([]);

    useEffect(() => {
        fetchInvestors().then(setInvestors);
    }, []);

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-6 text-center">💼 Investors</h1>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
                {investors.map((i, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm hover:shadow-lg transition"
                    >
                        <h2 className="text-xl font-semibold text-gray-800">
                            {i.name || "Unnamed Investor"}
                        </h2>
                        <p className="text-gray-500">{i.firm || "Firm not specified"}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Investors;
