import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { fetchInvestors } from "../services/api";

function Investors() {
    const [rows, setRows] = useState<any[]>([]);

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

    return (
        <div style={{ height: 500, width: "100%" }}>
            <h1 className="text-3xl font-bold mb-4 text-center">💼 Investors</h1>
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

export default Investors;
