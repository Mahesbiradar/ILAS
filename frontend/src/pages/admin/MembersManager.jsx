// src/pages/admin/MembersManager.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchMembers,
  deleteMember,
  updateMember,
  promoteMember,
  createMember,
  fetchMemberLogs,
} from "../../api/members";
import AddMemberForm from "../../components/admin/members/AddMemberForm";
import MemberTable from "../../components/admin/members/MemberTable";
import EditMemberModal from "../../components/admin/members/EditMemberModal";
import MemberLogs from "../../components/admin/members/MemberLogs";
import ExportReports from "../../components/admin/members/ExportReports";
import { usePagination } from "../../hooks/usePagination";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";

/**
 * MembersManager Page
 * Consolidated admin page for member management with server-side pagination
 */
export default function MembersManager() {
  const pagination = usePagination(20);
  const [members, setMembers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("members");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  // Load members with pagination and filters
  const loadMembers = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const data = await fetchMembers({
          page: opts.page || pagination.page,
          page_size: pagination.pageSize,
          search: opts.search !== undefined ? opts.search : search,
          role: opts.role !== undefined ? opts.role : roleFilter,
        });

        // Handle both paginated (with count, results) and non-paginated responses
        if (data.results !== undefined) {
          setMembers(data.results);
          pagination.setPaginationData({
            count: data.count,
            page: opts.page || pagination.page,
          });
        } else if (Array.isArray(data)) {
          setMembers(data);
          pagination.setPaginationData({ count: data.length });
        }
      } catch (error) {
        toast.error("Failed to fetch members");
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [pagination, search, roleFilter]
  );

  // Initial load
  useEffect(() => {
    loadMembers();
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      pagination.setPage(1);
      loadMembers({ search, page: 1 });
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Debounce role filter
  useEffect(() => {
    pagination.setPage(1);
    loadMembers({ role: roleFilter, page: 1 });
  }, [roleFilter]);

  // Load logs
  const loadLogs = useCallback(async () => {
    try {
      const data = await fetchMemberLogs();
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to fetch logs");
      console.error(error);
    }
  }, []);

  // Switch to logs tab
  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  const handleAdd = (newMember) => {
    toast.success("Member added successfully");
    pagination.setPage(1);
    loadMembers({ search: "", page: 1 });
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updated) => {
    try {
      await updateMember(updated.id, updated);
      toast.success("Member updated successfully");
      loadMembers();
      setShowEditModal(false);
    } catch (error) {
      toast.error("Failed to update member");
      console.error(error);
    }
  };

  const handleDelete = async (member) => {
    if (member.is_logged_in) {
      toast.error("Cannot delete a logged-in member");
      return;
    }
    try {
      await deleteMember(member.id);
      toast.success("Member deleted");
      loadMembers();
    } catch (error) {
      toast.error("Failed to delete member");
      console.error(error);
    }
  };

  const handlePromote = async (member) => {
    try {
      await promoteMember(member.id);
      toast.success("Member promoted successfully");
      loadMembers();
    } catch (error) {
      toast.error("Failed to promote member");
      console.error(error);
    }
  };

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
          {/* Filters */}
          <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-lg">
            <input
              type="text"
              placeholder="Search by username, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
              disabled={loading}
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
              disabled={loading}
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="librarian">Librarian</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
          )}

          {/* Member Table */}
          {!loading && (
            <>
              <MemberTable
                members={members}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPromote={handlePromote}
              />

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  Showing {members.length} of {pagination.count} members
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => pagination.goToPreviousPage()}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <div className="px-4 py-2 text-sm font-medium">
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </div>
                  <button
                    onClick={() => pagination.goToNextPage()}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
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
