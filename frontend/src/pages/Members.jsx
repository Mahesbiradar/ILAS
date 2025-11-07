import React, { useEffect, useState } from "react";
import {
  fetchMembers,
  deleteMember,
  promoteMember,
  fetchMemberLogs,
} from "../api/members";
import AddMemberForm from "../components/members/AddMemberForm";
import MemberTable from "../components/members/MemberTable";
import EditMemberModal from "../components/members/EditMemberModal";
import MemberLogs from "../components/members/MemberLogs";
import ExportReports from "../components/members/ExportReports";
import toast from "react-hot-toast";

export default function Members() {
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
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
      const data = await fetchMemberLogs();
      setLogs(data);
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
    try {
      const updated = await promoteMember(member.id);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      toast.success(`${member.username} promoted to ${updated.role}`);
    } catch {
      toast.error("Failed to promote member");
    }
  };

  const filteredMembers = members.filter((m) =>
    [m.username, m.email, m.role, m.unique_id]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-blue-700 mb-6 text-center">
        🏛️ Members Management
      </h1>

      <div className="space-y-5">
        {/* ➕ Add New Member */}
        <Section
          title="➕ Add New Member"
          desc="Create Admin / Librarian / User"
          active={activeSection === 1}
          onClick={() => setActiveSection(activeSection === 1 ? null : 1)}
        >
          <AddMemberForm onAdded={handleAdd} />
        </Section>

        {/* 🧭 Manage Members */}
        <Section
          title="🧭 Manage Members"
          desc="Edit, Promote, or Delete existing members"
          active={activeSection === 2}
          onClick={() => setActiveSection(activeSection === 2 ? null : 2)}
        >
          <input
            placeholder="Search members..."
            className="w-full border p-2 rounded mb-3 focus:ring focus:ring-blue-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <MemberTable
            members={filteredMembers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPromote={handlePromote}
          />
        </Section>

        {/* 🧾 Activity Logs */}
        <Section
          title="🧾 Activity Logs"
          desc="Track all member actions performed by admins"
          active={activeSection === 3}
          onClick={() => setActiveSection(activeSection === 3 ? null : 3)}
        >
          <MemberLogs logs={logs} onRefresh={loadLogs} />
        </Section>

        {/* 📤 Export Reports */}
        <Section
          title="📤 Export Reports"
          desc="Export logs for audit or review"
          active={activeSection === 4}
          onClick={() => setActiveSection(activeSection === 4 ? null : 4)}
        >
          <ExportReports />
        </Section>
      </div>

      {showEditModal && (
        <EditMemberModal
          member={selectedMember}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

function Section({ title, desc, active, onClick, children }) {
  return (
    <div className="bg-white shadow-md rounded-2xl border border-gray-100 transition-all">
      <button
        onClick={onClick}
        className="w-full text-left p-4 flex justify-between items-center"
      >
        <div>
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{desc}</p>
        </div>
        <span
          className={`text-gray-400 transform transition-transform ${
            active ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      </button>
      {active && <div className="p-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}
