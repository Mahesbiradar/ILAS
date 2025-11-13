// src/pages/admin/LibraryOperations.jsx
import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Zap, RotateCcw, Settings, Loader } from "lucide-react";
import { Button, Card, PageTitle, SectionHeader } from "../../components/common";
import Skeleton from "../../components/ui/Skeleton";
import BarcodeScanner from "../../components/admin/libraryOps/BarcodeScanner";
import ManualScanInput from "../../components/admin/libraryOps/ManualScanInput";
import ScanResultCard from "../../components/admin/libraryOps/ScanResultCard";
import { lookupBookByCode, issueBook, returnBook, updateBookStatus } from "../../services/transactionApi";

/**
 * LibraryOperations Page
 * Consolidated page for all barcode/issue/return operations:
 * - Tab 1: Issue Book (scan barcode + issue to user)
 * - Tab 2: Return Book (scan barcode + mark returned)
 * - Tab 3: Update Status (change book status)
 */
export default function LibraryOperations() {
  const [activeTab, setActiveTab] = useState("issue");
  const [scanResult, setScanResult] = useState(null);
  const [useScannerTab, setUseScannerTab] = useState("scanner");
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [newStatus, setNewStatus] = useState("AVAILABLE");
  const [remarks, setRemarks] = useState("");

  const handleScan = useCallback(async (code) => {
    try {
      setLoading(true);
      const bookData = await lookupBookByCode(code);
      
      // Normalize the API response
      setScanResult({
        book_code: bookData.book_code || code,
        book_title: bookData.title || "Unknown",
        author: bookData.author || "Unknown",
        category: bookData.category || "Unknown",
        shelf_location: bookData.shelf_location || "N/A",
        status: bookData.status || "Unknown",
        issued_to: bookData.issued_to || null,
        due_date: bookData.due_date || null,
      });
      toast.success(`Book scanned: ${bookData.title || code}`);
    } catch (err) {
      console.error("Lookup error:", err);
      toast.error(err.message || "Book not found");
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleIssueBook = async () => {
    if (!scanResult || !memberId || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await issueBook(scanResult.book_code, memberId, remarks);
      toast.success("Book issued successfully!");
      setScanResult(null);
      setMemberId("");
      setDueDate("");
      setRemarks("");
    } catch (err) {
      console.error("Issue error:", err);
      toast.error(err.message || "Failed to issue book");
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async () => {
    if (!scanResult) {
      toast.error("Please scan a book first");
      return;
    }

    try {
      setLoading(true);
      await returnBook(scanResult.book_code, null, remarks);
      toast.success("Book marked as returned!");
      setScanResult(null);
      setRemarks("");
    } catch (err) {
      console.error("Return error:", err);
      toast.error(err.message || "Failed to mark book as returned");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!scanResult || !newStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      setLoading(true);
      await updateBookStatus(scanResult.book_code, newStatus, remarks);
      toast.success("Book status updated!");
      setScanResult(null);
      setNewStatus("AVAILABLE");
      setRemarks("");
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.message || "Failed to update book status");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "issue", label: "📤 Issue Book" },
    { id: "return", label: "📥 Return Book" },
    { id: "status", label: "🔄 Update Status" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-4">
      <h1 className="text-3xl font-bold mb-6">
        📚 Library Operations
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
      {(activeTab === "issue" || activeTab === "return" || activeTab === "status") && (
        <div className="space-y-6">
          {/* Scanner/Manual Input Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUseScannerTab("scanner")}
              className={`px-4 py-2 rounded-lg ${
                useScannerTab === "scanner"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              📷 Camera Scanner
            </button>
            <button
              onClick={() => setUseScannerTab("manual")}
              className={`px-4 py-2 rounded-lg ${
                useScannerTab === "manual"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              ⌨️ Manual Input
            </button>
          </div>

          {/* Scanner or Manual Input */}
          {useScannerTab === "scanner" ? (
            <BarcodeScanner onDetected={handleScan} />
          ) : (
            <ManualScanInput onSubmit={handleScan} />
          )}

          {/* Scan Result Card */}
          {scanResult && (
            <ScanResultCard
              data={{
                copy_id: scanResult.book_code,
                book_title: scanResult.book_title,
                author: scanResult.author,
                category: scanResult.category,
                shelf_number: scanResult.shelf_location,
                status: scanResult.status,
              }}
              onApprove={handleIssueBook}
              onReturn={handleReturnBook}
            />
          )}

          {/* Operation Form */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {activeTab === "issue" && "📤 Issue Book to Member"}
              {activeTab === "return" && "📥 Mark Book as Returned"}
              {activeTab === "status" && "🔄 Update Book Status"}
            </h2>

            {loading && (
              <div className="mb-4">
                <Skeleton className="w-48 h-4 mb-2" />
                <Skeleton className="w-full h-6" />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scanned Book *
                </label>
                <input
                  type="text"
                  value={scanResult ? scanResult.book_title : ""}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                  placeholder="Scan a book to prefill"
                />
              </div>

              {(activeTab === "issue" || activeTab === "status") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === "issue" ? "Member ID *" : "New Status *"}
                  </label>
                  {activeTab === "issue" ? (
                    <input
                      type="text"
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      placeholder="Enter member ID"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  ) : (
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="ISSUED">Issued</option>
                      <option value="DAMAGED">Damaged</option>
                      <option value="LOST">Lost</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="REMOVED">Removed</option>
                    </select>
                  )}
                </div>
              )}

              {activeTab === "issue" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any notes..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows="3"
                />
              </div>

              <button
                onClick={
                  activeTab === "issue"
                    ? handleIssueBook
                    : activeTab === "return"
                    ? handleReturnBook
                    : handleUpdateStatus
                }
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {activeTab === "issue" && "📤 Issue Book"}
                {activeTab === "return" && "📥 Mark as Returned"}
                {activeTab === "status" && "🔄 Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
