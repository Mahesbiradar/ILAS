// src/pages/admin/LibraryOperations.jsx
import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";

import { Card, PageTitle, SectionHeader } from "../../components/common";

import ScannerPanel from "../../components/admin/libraryOps/ScannerPanel";
import ManualScanInput from "../../components/admin/libraryOps/ManualScanInput";
import ScanResultCard from "../../components/admin/libraryOps/ScanResultCard";
import MemberSearch from "../../components/admin/libraryOps/MemberSearch";
import MemberInfoCard from "../../components/admin/libraryOps/MemberInfoCard";

import {
  lookupBookByCode,
  issueBook,
  returnBook,
  updateBookStatus,
} from "../../services/transactionApi";

export default function LibraryOperations() {
  const [activeTab, setActiveTab] = useState("issue");
  const [scanData, setScanData] = useState(null);
  const [member, setMember] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [statusToSet, setStatusToSet] = useState("LOST");
  const [lastFine, setLastFine] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = useCallback(async (code) => {
    if (!code) return;
    setLoading(true);
    setScanData(null);
    setLastFine(null);

    try {
      const data = await lookupBookByCode(code.trim());
      setScanData(data);
      toast.success("Book found");
    } catch {
      toast.error("Book not found");
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAll = () => {
    setScanData(null);
    setMember(null);
    setRemarks("");
    setLastFine(null);
  };

  const handleMemberChosen = (m) => setMember(m || null);

  const handleIssue = async () => {
    if (!scanData?.id) return toast.error("Scan a book first");
    if (!member?.id) return toast.error("Select a member");

    setLoading(true);
    try {
      await issueBook(scanData.id, member.id, remarks);
      toast.success("Book issued successfully");
      setScanData(await lookupBookByCode(scanData.book_code));
      setRemarks("");
    } catch (err) {
      toast.error(err?.message || "Issue failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!scanData?.id) return toast.error("Scan a book first");

    setLoading(true);
    try {
      const res = await returnBook(scanData.id, member?.id || null, remarks);
      setLastFine(res?.fine_amount ?? null);
      toast.success("Returned");
      setScanData(await lookupBookByCode(scanData.book_code));
      setRemarks("");
    } catch (err) {
      toast.error(err?.message || "Return failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!scanData?.id) return toast.error("Scan a book first");

    setLoading(true);
    try {
      await updateBookStatus(scanData.id, statusToSet, remarks);
      toast.success("Status updated");
      setScanData(await lookupBookByCode(scanData.book_code));
      setRemarks("");
    } catch (err) {
      toast.error(err?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "issue", label: "Issue Book" },
    { id: "return", label: "Return Book" },
    { id: "status", label: "Change Status" },
    { id: "info", label: "Quick Info" },
  ];

  return (
    <div className="min-h-screen p-3 flex justify-center">
      {/* 70% scaling container */}
      <div className="scale-[0.70] origin-top w-full max-w-7xl mx-auto">

        <PageTitle className="mb-3 text-xl">Library Operations</PageTitle>

        {/* TABS */}
        <div className="flex gap-3 mb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); resetAll(); }}
              className={`px-5 py-2 text-sm rounded-lg shadow-sm transition 
                ${activeTab === t.id ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}
              `}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* LEFT 40% */}
          <div className="md:col-span-5 space-y-4">

            <Card className="p-3 rounded-xl shadow-sm">
              <SectionHeader title="Scan / Enter Book Code" small />
              <div className="space-y-3 mt-3">
                <ScannerPanel onDetected={handleLookup} />
                <ManualScanInput onSubmit={handleLookup} />
              </div>
            </Card>

            {(activeTab === "issue" || activeTab === "return") && (
              <Card className="p-3 rounded-xl shadow-sm">
                <SectionHeader title="Search Member" small />
                <div className="space-y-3 mt-3">
                  <MemberSearch onSelect={handleMemberChosen} />

                  {member && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 shadow-sm">
                        {member.full_name || member.username} ({member.unique_id})
                      </span>
                      <button
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg"
                        onClick={() => setMember(null)}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <MemberInfoCard member={member} compact />
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT 60% */}
          <div className="md:col-span-7 space-y-4">

            <Card className="p-3 rounded-xl shadow-sm">
              <SectionHeader title="Book Details" small />
              <div className="mt-3">
                {!scanData && (
                  <p className="text-xs text-gray-500">No book scanned yet.</p>
                )}
                {scanData && <ScanResultCard data={scanData} />}
              </div>
            </Card>

            {scanData && (
              <Card className="p-3 rounded-xl shadow-sm">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">

                  {(activeTab === "issue" || activeTab === "return") && (
                    <div>
                      <label className="text-[10px] text-gray-500">Selected Member</label>
                      <input
                        readOnly
                        className="w-full rounded-lg border px-3 py-2 mt-1 bg-gray-50"
                        value={
                          member ?
                          `${member.full_name || member.username} (${member.unique_id})` : ""
                        }
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-gray-500">Remarks</label>
                    <input
                      className="w-full rounded-lg border px-3 py-2 mt-1"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    {activeTab === "issue" && (
                      <>
                        <label className="text-[10px] text-gray-500">Due Date</label>
                        <input type="date" className="w-full rounded-lg border px-3 py-2 mt-1" />
                      </>
                    )}

                    {activeTab === "return" && (
                      <>
                        <label className="text-[10px] text-gray-500">Last Fine</label>
                        <div className="text-red-600 font-semibold mt-3">
                          {lastFine !== null ? `₹ ${lastFine}` : "—"}
                        </div>
                      </>
                    )}

                    {activeTab === "status" && (
                      <>
                        <label className="text-[10px] text-gray-500">Change Status</label>
                        <select
                          value={statusToSet}
                          onChange={(e) => setStatusToSet(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 mt-1"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="LOST">LOST</option>
                          <option value="DAMAGED">DAMAGED</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                          <option value="REMOVED">REMOVED</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-4 mt-5">
                  {activeTab === "issue" && (
                    <ActionBtn loading={loading} onClick={handleIssue} color="green">
                      Issue Book
                    </ActionBtn>
                  )}
                  {activeTab === "return" && (
                    <ActionBtn loading={loading} onClick={handleReturn} color="blue">
                      Mark Returned
                    </ActionBtn>
                  )}
                  {activeTab === "status" && (
                    <ActionBtn loading={loading} onClick={handleStatusUpdate} color="yellow">
                      Update Status
                    </ActionBtn>
                  )}

                  <button
                    onClick={resetAll}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs"
                  >
                    Clear
                  </button>
                </div>

              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ children, loading, onClick, color }) {
  const colors = {
    green: "bg-green-600 hover:bg-green-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-5 py-2 rounded-lg text-sm shadow-sm flex items-center gap-2 ${colors[color]}
        disabled:opacity-50`}
    >
      {loading && <Loader className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
