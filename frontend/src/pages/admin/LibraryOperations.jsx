// src/pages/admin/LibraryOperations.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Zap, RotateCcw, Settings } from "lucide-react";
import { Button, Card, PageTitle, SectionHeader } from "../../components/common";
import BarcodeScanner from "../../components/admin/libraryOps/BarcodeScanner";
import ManualScanInput from "../../components/admin/libraryOps/ManualScanInput";
import ScanResultCard from "../../components/admin/libraryOps/ScanResultCard";

/**
 * LibraryOperations Page
 * Consolidated page for all barcode/issue/return operations:
 * - Tab 1: Issue Book (scan barcode + issue to user)
 * - Tab 2: Return Book (scan barcode + mark returned)
 * - Tab 3: Update Status (change book status)
 * - Tab 4: Barcode Lookup (search by barcode)
 */
export default function LibraryOperations() {
  const [activeTab, setActiveTab] = useState("issue");
  const [scanResult, setScanResult] = useState(null);
  const [useScannerTab, setUseScannerTab] = useState("scanner");

  const handleScan = (code) => {
    // TODO: Call transactionApi to lookup book and prefill form
    toast.success(`Scanned: ${code}`);
    setScanResult({ copy_id: code, book_title: "Sample Book", author: "Author", category: "Category", shelf_number: "A1", status: "Available" });
  };

  const tabs = [
    { id: "issue", label: "📤 Issue Book" },
    { id: "return", label: "📥 Return Book" },
    { id: "status", label: "🔄 Update Status" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
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
              data={scanResult}
              onApprove={() => toast.success("Book issued!")}
              onReturn={() => toast.success("Book marked as returned!")}
            />
          )}

          {/* Operation Form */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {activeTab === "issue" && "📤 Issue Book to Member"}
              {activeTab === "return" && "📥 Mark Book as Returned"}
              {activeTab === "status" && "🔄 Update Book Status"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Copy/Barcode Code *
                </label>
                <input
                  type="text"
                  placeholder="Enter or scan barcode"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              {(activeTab === "issue" || activeTab === "status") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === "issue" ? "Member Name *" : "New Status *"}
                  </label>
                  {activeTab === "issue" ? (
                    <input
                      type="text"
                      placeholder="Search member..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    />
                  ) : (
                    <select className="w-full border border-gray-300 rounded-lg px-4 py-2">
                      <option>Available</option>
                      <option>Issued</option>
                      <option>Reserved</option>
                      <option>Damaged</option>
                      <option>Lost</option>
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              )}

              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
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
