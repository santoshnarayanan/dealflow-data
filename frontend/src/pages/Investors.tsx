import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { fetchInvestors } from "../services/api";

function Investors() {
    const [rows, setRows] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchInvestors().then((data) => {
            const formatted = data.map((item: any, index: number) => ({
                id: index + 1,
                name: item.name || "Unnamed Investor",
                firm: item.firm || "N/A",
            }));
            setRows(formatted);
        });
    }, []);

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 90 },
        { field: "name", headerName: "Name", flex: 1 },
        { field: "firm", headerName: "Firm", flex: 1 },
    ];

    const filteredRows = rows.filter(
        (row) =>
            row.name.toLowerCase().includes(search.toLowerCase()) ||
            row.firm.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ height: 550, width: "100%" }}>
            <h1 className="text-3xl font-bold mb-4 text-center">💼 Investors</h1>

            {/* Search bar */}
            <div className="mb-4 flex justify-center">
                <input
                    type="text"
                    placeholder="Search investors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSizeOptions={[5, 10]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 5 } },
                }}
                disableRowSelectionOnClick
                getRowClassName={(params) =>
                    params.indexRelativeToCurrentPage % 2 === 0
                        ? "even-row"
                        : "odd-row"
                }
            />
        </div>
    );
}

export default Investors;
