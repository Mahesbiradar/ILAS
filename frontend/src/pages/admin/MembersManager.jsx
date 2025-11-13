// src/pages/admin/MembersManager.jsx
import React, { useEffect, useState } from "react";
import {
  fetchMembers,
  deleteMember,
} from "../../api/members";
import AddMemberForm from "../../components/admin/members/AddMemberForm";
import MemberTable from "../../components/admin/members/MemberTable";
import EditMemberModal from "../../components/admin/members/EditMemberModal";
import MemberLogs from "../../components/admin/members/MemberLogs";
import ExportReports from "../../components/admin/members/ExportReports";
import toast from "react-hot-toast";

/**
 * MembersManager Page
 * Consolidated admin page for member management
 */
export default function MembersManager() {
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("members");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadMembers();
    loadLogs();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch {
      toast.error("Failed to fetch members");
    }
  };

  const loadLogs = async () => {
    try {
      // TODO: Call actual API endpoint when ready
      setLogs([]);
    } catch {
      toast.error("Failed to fetch logs");
    }
  };

  const handleAdd = (newMember) => {
    setMembers((prev) => [newMember, ...prev]);
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updated) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setShowEditModal(false);
  };

  const handleDelete = async (member) => {
    if (member.is_logged_in) {
      toast.error("Cannot delete a logged-in member");
      return;
    }
    try {
      await deleteMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success("Member deleted");
    } catch {
      toast.error("Failed to delete member");
    }
  };

  const handlePromote = async (member) => {
    // TODO: Implement promotion logic
    toast.info("Promotion feature coming soon");
  };

  const filteredMembers = members.filter((m) =>
    [m.username, m.email, m.role]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const tabs = [
    { id: "members", label: "👥 All Members" },
    { id: "add", label: "➕ Add Member" },
    { id: "logs", label: "📋 Activity Logs" },
    { id: "export", label: "📤 Export Reports" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
        👥 Members Manager
      </h1>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
          />

          {/* Member Table */}
          <MemberTable
            members={filteredMembers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPromote={handlePromote}
          />
        </div>
      )}

      {activeTab === "add" && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">➕ Add New Member</h2>
          <AddMemberForm onAdded={handleAdd} />
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">📋 Activity Logs</h2>
          <MemberLogs logs={logs} onRefresh={loadLogs} />
        </div>
      )}

      {activeTab === "export" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">📤 Export Reports</h2>
          <ExportReports />
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMember && (
        <EditMemberModal
          member={selectedMember}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
