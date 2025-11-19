// src/pages/admin/LibraryOperations.jsx
import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";
import { Card, PageTitle, SectionHeader } from "../../components/common";
import Skeleton from "../../components/ui/Skeleton";

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
  const [activeTab, setActiveTab] = useState("issue"); // issue | return | status | info
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [statusToSet, setStatusToSet] = useState("LOST");
  const [lastFine, setLastFine] = useState(null);

  // Lookup book by barcode or manual input
  const handleLookup = useCallback(async (code) => {
    if (!code) return;
    setLoading(true);
    setScanData(null);
    setLastFine(null);

    try {
      const data = await lookupBookByCode(code.trim());
      setScanData(data);
      toast.success(`Found: ${data.title || data.book_code}`);
    } catch (err) {
      toast.error(err?.message || "Book not found");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMemberChosen = (m) => {
    setMember(m || null);
  };

  // Issue Book
  const handleIssue = async () => {
    if (!scanData?.id) return toast.error("Scan a valid book first.");
    if (!member?.id) return toast.error("Select a member.");

    setLoading(true);
    try {
      await issueBook(scanData.id, member.id, remarks);
      toast.success("Book issued successfully.");
      const fresh = await lookupBookByCode(scanData.book_code);
      setScanData(fresh);
      setRemarks("");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to issue book");
    } finally {
      setLoading(false);
    }
  };

  // Return Book
  const handleReturn = async () => {
    if (!scanData?.id) return toast.error("Scan a valid book first.");

    if (!member?.id) {
      const ok = window.confirm("No member selected. Proceed anyway?");
      if (!ok) return;
    }

    setLoading(true);
    try {
      const res = await returnBook(scanData.id, member?.id || null, remarks);

      if (res?.fine_amount !== undefined) {
        setLastFine(res.fine_amount);
        toast.success(`Book returned. Fine: ₹ ${res.fine_amount}`);
      } else {
        toast.success("Book returned.");
      }

      const fresh = await lookupBookByCode(scanData.book_code);
      setScanData(fresh);
      setRemarks("");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Return failed");
    } finally {
      setLoading(false);
    }
  };

  // Update Status
  const handleStatusUpdate = async () => {
    if (!scanData?.id) return toast.error("Scan a valid book first.");

    setLoading(true);
    try {
      await updateBookStatus(scanData.id, statusToSet, remarks);
      toast.success("Status updated.");

      const fresh = await lookupBookByCode(scanData.book_code);
      setScanData(fresh);
      setRemarks("");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setScanData(null);
    setMember(null);
    setRemarks("");
    setLastFine(null);
  };

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
                activeTab === t.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT SIDE — Scanner + Member search */}
          <div className="md:col-span-1">
            <Card>
              <SectionHeader title="Scan / Enter Book Code" />
              <ScannerPanel onDetected={handleLookup} />
              <ManualScanInput onSubmit={handleLookup} />
            </Card>

            {(activeTab === "issue" || activeTab === "return") && (
              <Card className="mt-4">
                <SectionHeader title="Search Member" />
                <MemberSearch onSelect={handleMemberChosen} />

                {/* Member preview card */}
                <MemberInfoCard member={member} />
              </Card>
            )}
          </div>

          {/* RIGHT SIDE — Book Details + Actions */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <SectionHeader title="Book Details" />

              {loading && <Skeleton className="h-4 w-48 mb-2" />}
              {!loading && !scanData && (
                <p className="text-sm text-gray-600">
                  No book scanned yet. Start scanning or enter book code manually.
                </p>
              )}

              {scanData && (
                <>
                  <ScanResultCard data={scanData} />

                  {/* Action Zone */}
                  <div className="bg-gray-50 p-4 rounded mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {activeTab === "issue" && (
                        <>
                          <Field label="Selected Member">
                            <input
                              readOnly
                              value={member?.full_name || ""}
                              placeholder="Select member"
                              className="rounded border px-3 py-2 w-full bg-white"
                            />
                          </Field>

                          <Field label="Remarks">
                            <input
                              className="w-full rounded border px-3 py-2"
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                            />
                          </Field>

                          <Field label="Due Date (optional)">
                            <input type="date" className="w-full rounded border px-3 py-2" />
                          </Field>
                        </>
                      )}

                      {activeTab === "return" && (
                        <>
                          <Field label="Member (optional)">
                            <input
                              readOnly
                              value={member?.full_name || ""}
                              placeholder="Select member"
                              className="rounded border px-3 py-2 w-full bg-white"
                            />
                          </Field>

                          <Field label="Last Fine">
                            <p className="text-red-600 font-semibold text-sm">
                              {lastFine !== null ? `₹ ${lastFine}` : "—"}
                            </p>
                          </Field>

                          <Field label="Remarks">
                            <input
                              className="w-full rounded border px-3 py-2"
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                            />
                          </Field>
                        </>
                      )}

                      {activeTab === "status" && (
                        <>
                          <Field label="New Status">
                            <select
                              value={statusToSet}
                              onChange={(e) => setStatusToSet(e.target.value)}
                              className="w-full rounded border px-3 py-2"
                            >
                              <option value="AVAILABLE">AVAILABLE</option>
                              <option value="LOST">LOST</option>
                              <option value="DAMAGED">DAMAGED</option>
                              <option value="MAINTENANCE">MAINTENANCE</option>
                              <option value="REMOVED">REMOVED</option>
                            </select>
                          </Field>

                          <Field label="Remarks" wide>
                            <input
                              className="w-full rounded border px-3 py-2"
                              value={remarks}
                              onChange={(e) => setRemarks(e.target.value)}
                            />
                          </Field>
                        </>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-4">
                      {activeTab === "issue" && (
                        <ActionButton onClick={handleIssue} loading={loading} color="green">
                          Issue Book
                        </ActionButton>
                      )}
                      {activeTab === "return" && (
                        <ActionButton onClick={handleReturn} loading={loading} color="blue">
                          Mark as Returned
                        </ActionButton>
                      )}
                      {activeTab === "status" && (
                        <ActionButton onClick={handleStatusUpdate} loading={loading} color="yellow">
                          Update Status
                        </ActionButton>
                      )}

                      <button
                        onClick={resetAll}
                        className="px-3 py-2 bg-gray-100 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small UI helper */
function Field({ label, children, wide }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <label className="text-xs text-gray-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/* Button helper */
function ActionButton({ children, onClick, loading, color }) {
  const colors = {
    green: "bg-green-600 hover:bg-green-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    yellow: "bg-yellow-600 hover:bg-yellow-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-4 py-2 text-white rounded ${colors[color]} disabled:opacity-60 flex items-center gap-2`}
    >
      {loading && <Loader className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
