import React, { useState } from "react";
import toast from "react-hot-toast";
import { exportMemberLogs, exportAllMembers } from "../../../api/members";
import { Download, Users, FileText } from "lucide-react";

export default function ExportReports() {
  const [loading, setLoading] = useState(false);

  const download = (blobData, filename) => {
    const blob = new Blob([blobData], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportLogs = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await exportMemberLogs();
      if (!data || data.size === 0) {
        toast.error("No activity logs available");
        return;
      }
      download(data, "member_activity_logs.csv");
      toast.success("Member logs exported");
    } catch {
      toast.error("Failed to export logs");
    } finally {
      setLoading(false);
    }
  };

  const handleExportMembers = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await exportAllMembers();   // blob, not response
      if (!blob || blob.size === 0) {
        toast.error("No members found");
        return;
      }
      download(blob, "members_master_data.csv");
      toast.success("All member data exported");
    } catch {
      toast.error("Failed to export members");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col sm:flex-row gap-6 justify-center bg-white border border-gray-200 rounded-xl p-6">
      <div className="text-center">
        <button
          onClick={handleExportLogs}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
        >
          <FileText size={16} />
          Export Activity Logs
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Includes action, user, role, timestamp
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={handleExportMembers}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
        >
          <Users size={16} />
          Export All Members
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Full member master data (all fields)
        </p>
      </div>
    </div>
  );
}
