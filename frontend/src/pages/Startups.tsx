import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { fetchStartups } from "../services/api";

function Startups() {
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        fetchStartups().then((data) => {
            const formatted = data.map((item: any, index: number) => ({
                id: index + 1,
                name: item.name || "Unnamed Startup",
                industry: item.industry || "N/A",
            }));
            setRows(formatted);
        });
    }, []);

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 90 },
        { field: "name", headerName: "Startup Name", flex: 1 },
        { field: "industry", headerName: "Industry", flex: 1 },
    ];

    return (
        <div style={{ height: 500, width: "100%" }}>
            <h1 className="text-3xl font-bold mb-4 text-center">🚀 Startups</h1>
            <DataGrid
                rows={rows}
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

export default Startups;
