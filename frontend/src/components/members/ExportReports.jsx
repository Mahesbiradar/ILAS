import React, { useState } from "react";
import toast from "react-hot-toast";
import { exportMemberLogs } from "../../api/members";

export default function ExportReports() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Fetch the CSV file
      const blobData = await exportMemberLogs("");
      if (!blobData || blobData.size === 0) {
        toast.error("No logs available to export");
        setLoading(false);
        return;
      }

      // Create and download CSV file
      const blob = new Blob([blobData], { type: "text/csv;charset=utf-8;" });
      const fileName = `member_logs_all.csv`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Logs exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={handleExport}
        disabled={loading}
        className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
      >
        {loading ? "Exporting..." : "⬇️ Export CSV"}
      </button>
    </div>
  );
}
