// src/components/members/ExportReports.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { exportMemberLogs, exportAllMembers } from "../../api/members";
import { Download, Users, FileText } from "lucide-react";

export default function ExportReports() {
  const [loading, setLoading] = useState(false);

  const handleExportLogs = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blobData = await exportMemberLogs();
      if (!blobData || blobData.size === 0) {
        toast.error("No activity logs available.");
        return;
      }

      const blob = new Blob([blobData], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "member_logs.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Activity logs exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export logs");
    } finally {
      setLoading(false);
    }
  };

  const handleExportMembers = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blobData = await exportAllMembers();
      if (!blobData || blobData.size === 0) {
        toast.error("No members found to export.");
        return;
      }

      const blob = new Blob([blobData], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "all_members.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("All members exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export members");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center bg-white border border-gray-100 rounded-xl shadow-sm p-6">
      <div className="flex flex-col items-center text-center">
        <button
          onClick={handleExportLogs}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition-all duration-200 disabled:opacity-50"
        >
          <FileText size={18} />
          {loading ? "Exporting..." : "Export Activity Logs"}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Download all member activity logs as CSV
        </p>
      </div>

      <div className="flex flex-col items-center text-center">
        <button
          onClick={handleExportMembers}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-all duration-200 disabled:opacity-50"
        >
          <Users size={18} />
          {loading ? "Exporting..." : "Export All Members"}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Download full member list as CSV
        </p>
      </div>
    </div>
  );
}
