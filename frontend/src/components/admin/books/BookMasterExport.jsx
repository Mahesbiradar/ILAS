import { useState } from "react";
import { exportBookMaster } from "../../../api/libraryApi";

const ALL_FIELDS = [
    "book_code",
    "title",
    "subtitle",
    "author",
    "publisher",
    "edition",
    "publication_year",
    "isbn",
    "language",
    "category",
    "keywords",
    "description",
    "accession_no",
    "shelf_location",
    "condition",
    "book_cost",
    "vendor_name",
    "source",
    "library_section",
    "dewey_decimal",
    "cataloger",
    "remarks",
    "status",
    "is_active",
    "created_at",
    "updated_at",
    "last_modified_by_name",
];

export default function BookMasterExport() {
    const [selectedFields, setSelectedFields] = useState(ALL_FIELDS);
    const [filters, setFilters] = useState({
        title: "",
        author: "",
        category: "",
        shelf_location: "",
        source: "",
    });
    const [loading, setLoading] = useState(false);

    const toggleField = (field) => {
        setSelectedFields((prev) =>
            prev.includes(field)
                ? prev.filter((f) => f !== field)
                : [...prev, field]
        );
    };

    const handleDownload = async () => {
        try {
            setLoading(true);
            const res = await exportBookMaster({
                ...filters,
                fields: selectedFields.join(","),
            });

            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "books_master.xlsx";
            a.click();
            window.URL.revokeObjectURL(url);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded bg-white space-y-4">
            <h3 className="text-lg font-semibold">📘 Book Master Export</h3>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(filters).map((key) => (
                    <input
                        key={key}
                        placeholder={`Filter by ${key.replace("_", " ")}`}
                        value={filters[key]}
                        onChange={(e) =>
                            setFilters({ ...filters, [key]: e.target.value })
                        }
                        className="border p-2 rounded text-sm"
                    />
                ))}
            </div>

            {/* Field Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-auto border p-2 rounded">
                {ALL_FIELDS.map((field) => (
                    <label key={field} className="text-sm flex gap-2 items-center">
                        <input
                            type="checkbox"
                            checked={selectedFields.includes(field)}
                            onChange={() => toggleField(field)}
                        />
                        {field}
                    </label>
                ))}
            </div>

            <button
                onClick={handleDownload}
                disabled={loading || selectedFields.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                {loading ? "Downloading..." : "Download Excel"}
            </button>
        </div>
    );
}
