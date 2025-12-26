import { useState } from "react";
import { exportBookLogs } from "../../../api/libraryApi";

export default function BookLogExport() {
    const [filters, setFilters] = useState({
        book_code: "",
        actor: "",
        action: "",
        start_date: "",
        end_date: "",
    });
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        try {
            setLoading(true);
            const res = await exportBookLogs(filters);

            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "book_logs.xlsx";
            a.click();
            window.URL.revokeObjectURL(url);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded bg-white space-y-4">
            <h3 className="text-lg font-semibold">📜 Book Audit Log Export</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(filters).map(([key, val]) => (
                    <input
                        key={key}
                        type={key.includes("date") ? "date" : "text"}
                        placeholder={key.replace("_", " ")}
                        value={val}
                        onChange={(e) =>
                            setFilters({ ...filters, [key]: e.target.value })
                        }
                        className="border p-2 rounded text-sm"
                    />
                ))}
            </div>

            <button
                onClick={handleDownload}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded"
            >
                {loading ? "Downloading..." : "Download Logs"}
            </button>
        </div>
    );
}
