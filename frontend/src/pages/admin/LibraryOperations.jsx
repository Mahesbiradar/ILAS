// src/pages/admin/LibraryOperations.jsx
import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";
import { Button, Card, PageTitle, SectionHeader } from "../../components/common";
import Skeleton from "../../components/ui/Skeleton";

import ScannerPanel from "../../components/admin/libraryOps/ScannerPanel";
import ManualScanInput from "../../components/admin/libraryOps/ManualScanInput";
import ScanResultCard from "../../components/admin/libraryOps/ScanResultCard";
import MemberSearch from "../../components/admin/libraryOps/MemberSearch";

import {
  lookupBookByCode,
  issueBook,
  returnBook,
  updateBookStatus,
} from "../../services/transactionApi";

export default function LibraryOperations() {
  const [activeTab, setActiveTab] = useState("issue"); // issue | return | status | info
  const [scanData, setScanData] = useState(null); // normalized book object (with id)
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(null); // selected member object {id, name, usn...}
  const [remarks, setRemarks] = useState("");
  const [statusToSet, setStatusToSet] = useState("LOST");
  const [lastFine, setLastFine] = useState(null);

  // Called when scanner or manual input provides a code
  const handleLookup = useCallback(async (code) => {
    if (!code) return;
    setLoading(true);
    setScanData(null);
    setLastFine(null);
    try {
      const data = await lookupBookByCode(code.trim());
      // data is normalized by service and includes id & book_code etc.
      setScanData(data);
      toast.success(`Found: ${data.title || data.book_code}`);
    } catch (err) {
      console.error("Lookup error:", err);
      toast.error(err?.message || "Book not found");
    } finally {
      setLoading(false);
    }
  }, []);

  // Member chosen from MemberSearch
  const handleMemberChosen = (m) => {
    setMember(m || null);
  };

  // ISSUE flow
  const handleIssue = async () => {
    if (!scanData || !scanData.id) {
      toast.error("Scan a valid book first.");
      return;
    }
    if (!member || !member.id) {
      toast.error("Select a member (USN / EmpID).");
      return;
    }
    setLoading(true);
    try {
      const res = await issueBook(scanData.id, member.id, remarks);
      // res may include updated book/transaction — refresh lookup if possible
      toast.success("Book issued successfully.");
      // Refresh book details
      try {
        const fresh = await lookupBookByCode(scanData.book_code);
        setScanData(fresh);
      } catch (e) {}
      setRemarks("");
    } catch (err) {
      console.error("Issue error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to issue book";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // RETURN flow
  const handleReturn = async () => {
    if (!scanData || !scanData.id) {
      toast.error("Scan a valid book first.");
      return;
    }
    // For returns, member selection is optional if backend identifies who returned; but we prefer member id
    if (!member || !member.id) {
      // let user confirm (we allow return with unknown member if backend allows)
      const confirm = window.confirm(
        "No member selected. Proceed to mark returned without member ID?"
      );
      if (!confirm) return;
    }
    setLoading(true);
    try {
      const res = await returnBook(scanData.id, member ? member.id : null, remarks);
      // backend returns fine_amount sometimes
      if (res && (res.fine_amount || res.fine_amount === 0)) {
        setLastFine(res.fine_amount);
        toast.success(`Book returned. Fine: ${res.fine_amount}`);
      } else {
        toast.success("Book returned.");
      }
      // refresh lookup
      try {
        const fresh = await lookupBookByCode(scanData.book_code);
        setScanData(fresh);
      } catch (e) {}
      setRemarks("");
    } catch (err) {
      console.error("Return error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to return book";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // STATUS update flow
  const handleStatusUpdate = async () => {
    if (!scanData || !scanData.id) {
      toast.error("Scan a valid book first.");
      return;
    }
    setLoading(true);
    try {
      await updateBookStatus(scanData.id, statusToSet, remarks);
      toast.success("Book status updated.");
      // refresh lookup
      try {
        const fresh = await lookupBookByCode(scanData.book_code);
        setScanData(fresh);
      } catch (e) {}
      setRemarks("");
    } catch (err) {
      console.error("Status update error:", err);
      const msg = err?.response?.data?.message || err?.message || "Status update failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Clear everything
  const resetAll = () => {
    setScanData(null);
    setMember(null);
    setRemarks("");
    setLastFine(null);
  };

  // Tab definitions
  const tabs = [
    { id: "issue", label: "Issue Book" },
    { id: "return", label: "Return Book" },
    { id: "status", label: "Change Status" },
    { id: "info", label: "Quick Info" },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <PageTitle>Library Operations</PageTitle>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                resetAll();
              }}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === t.id ? "bg-blue-600 text-white" : "bg-white text-gray-700 border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Main area: left scanner + right result/actions (responsive stack on small screens) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: Scanner / Manual input */}
          <div className="md:col-span-1">
            <Card>
              <SectionHeader title="Scan / Enter Book Code" />
              <div className="space-y-3">
                <ScannerPanel onDetected={handleLookup} />
                <div className="text-sm text-gray-500 mt-2">
                  You can also paste or type book code in the Manual input once scanner is closed.
                </div>
                <ManualScanInput onSubmit={handleLookup} />
              </div>
            </Card>

            {/* Member search (only show in tabs that need member selection) */}
            {(activeTab === "issue" || activeTab === "return") && (
              <Card className="mt-4">
                <SectionHeader title="Member (Search by USN / Employee ID)" />
                <MemberSearch onSelect={handleMemberChosen} />
                {member && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-700">
                      <strong>{member.full_name || member.name}</strong>
                    </div>
                    <div className="text-xs text-gray-500">ID: {member.id} • {member.usn || member.employee_id || ""}</div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right column: Book result + actions */}
          <div className="md:col-span-2 space-y-4">
            {/* Book info card */}
            <Card>
              <SectionHeader title="Scanned Book" />
              {loading && <Skeleton className="h-4 w-48 mb-2" />}
              {!loading && !scanData && (
                <div className="text-sm text-gray-600">No book scanned. Start scanner or enter code manually.</div>
              )}

              {scanData && (
                <div className="space-y-3">
                  <ScanResultCard data={scanData} />
                  {/* Actions area by tab */}
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Member / status / remarks */}
                      {activeTab === "issue" && (
                        <>
                          <div>
                            <label className="text-xs text-gray-600">Member</label>
                            <div className="mt-1">
                              <input
                                type="text"
                                readOnly
                                value={member ? (member.full_name || member.name) : ""}
                                placeholder="Select member"
                                className="w-full rounded border px-3 py-2 bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Remarks (optional)</label>
                            <input
                              className="w-full rounded border px-3 py-2"
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Due date (optional)</label>
                            <input type="date" className="w-full rounded border px-3 py-2" />
                          </div>
                        </>
                      )}

                      {activeTab === "return" && (
                        <>
                          <div>
                            <label className="text-xs text-gray-600">Member (optional)</label>
                            <input
                              type="text"
                              readOnly
                              value={member ? (member.full_name || member.name) : ""}
                              placeholder="Select member (optional)"
                              className="w-full rounded border px-3 py-2 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Last fine</label>
                            <div className="text-sm text-gray-700 mt-1">
                              {lastFine !== null ? <span className="text-red-600">₹ {lastFine}</span> : <span>—</span>}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Remarks</label>
                            <input className="w-full rounded border px-3 py-2" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                          </div>
                        </>
                      )}

                      {activeTab === "status" && (
                        <>
                          <div>
                            <label className="text-xs text-gray-600">New Status</label>
                            <select className="w-full rounded border px-3 py-2" value={statusToSet} onChange={(e) => setStatusToSet(e.target.value)}>
                              <option value="AVAILABLE">AVAILABLE</option>
                              <option value="LOST">LOST</option>
                              <option value="DAMAGED">DAMAGED</option>
                              <option value="MAINTENANCE">MAINTENANCE</option>
                              <option value="REMOVED">REMOVED</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs text-gray-600">Remarks</label>
                            <input className="w-full rounded border px-3 py-2" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-4">
                      {activeTab === "issue" && (
                        <button onClick={handleIssue} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60" disabled={loading}>
                          {loading ? <Loader className="animate-spin" /> : "Issue Book"}
                        </button>
                      )}
                      {activeTab === "return" && (
                        <button onClick={handleReturn} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
                          {loading ? <Loader className="animate-spin" /> : "Mark as Returned"}
                        </button>
                      )}
                      {activeTab === "status" && (
                        <button onClick={handleStatusUpdate} className="bg-yellow-600 text-white px-4 py-2 rounded" disabled={loading}>
                          {loading ? <Loader className="animate-spin" /> : "Update Status"}
                        </button>
                      )}

                      <button onClick={resetAll} className="bg-gray-100 px-3 py-2 rounded">Clear</button>
                    </div>

                    {lastFine !== null && (
                      <div className="mt-3 text-sm text-red-600">Last returned fine: ₹ {lastFine}</div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Quick Info tab additional area */}
            {activeTab === "info" && (
              <Card>
                <SectionHeader title="Quick Info" />
                {scanData ? (
                  <div>
                    <ScanResultCard data={scanData} />
                    {/* optionally show action shortcuts */}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => { setActiveTab("issue"); }} className="px-3 py-2 bg-blue-600 text-white rounded">Issue</button>
                      <button onClick={() => { setActiveTab("return"); }} className="px-3 py-2 bg-gray-200 rounded">Return</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Scan a book to view its full metadata here.</div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
