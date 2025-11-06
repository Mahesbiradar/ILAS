// src/components/libraryOps/BulkUploadManager.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { downloadTemplate } from "../../api/libraryApi";
import { motion, AnimatePresence } from "framer-motion";

export default function BulkUploadManager({ onUploaded }) {
  const [show, setShow] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSummary, setUploadSummary] = useState(null);

  // Handle file selection
  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) setter(file);
  };

  // Handle Upload
  const handleUpload = async () => {
    if (!excelFile) {
      toast.error("⚠️ Please select an Excel (.xlsx) file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);
    if (zipFile) formData.append("images", zipFile);

    try {
      setUploading(true);
      setProgress(0);
      setUploadSummary(null);

      const res = await axios.post("/api/books/bulk_upload/", formData, {
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        },
      });

      setProgress(100);
      const summary = res.data || {};
      toast.success(`✅ ${summary.created || 0} books uploaded successfully!`);
      setUploadSummary(summary);

      // Reset after short delay
      setTimeout(() => {
        setExcelFile(null);
        setZipFile(null);
        setProgress(0);
        setShow(false);
        onUploaded?.(); // Refresh book list
      }, 1200);
    } catch (err) {
      console.error("Bulk upload error:", err.response?.data || err.message);
      toast.error("❌ Bulk upload failed. Check file format or data.");
    } finally {
      setUploading(false);
    }
  };

  // Template Download
  const handleTemplateDownload = async () => {
    try {
      const res = await downloadTemplate();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ILAS_BookBulkTemplate.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("⚠️ Template download failed.");
    }
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setShow((p) => !p)}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md transition"
      >
        📦 Bulk Upload
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md">
          {show ? "▲" : "▼"}
        </span>
      </button>

      {/* Expandable Section */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-xl shadow-xl w-80 p-4"
          >
            <h3 className="text-gray-700 font-semibold mb-2 text-sm">
              📤 Upload Books in Bulk
            </h3>

            <div className="space-y-3 text-xs">
              {/* Excel Upload */}
              <div>
                <label className="font-medium text-gray-600">
                  Excel File (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => handleFileChange(e, setExcelFile)}
                  className="w-full border rounded-md px-2 py-1 mt-1"
                />
              </div>

              {/* ZIP Upload */}
              <div>
                <label className="font-medium text-gray-600">
                  Cover Images ZIP (optional)
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => handleFileChange(e, setZipFile)}
                  className="w-full border rounded-md px-2 py-1 mt-1"
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut", duration: 0.2 }}
                    />
                  </div>
                  <p className="text-gray-500 text-right mt-1">{progress}%</p>
                </div>
              )}

              {/* Upload Summary */}
              {uploadSummary && !uploading && (
                <div className="bg-green-50 border border-green-200 rounded-md p-2 text-green-700 text-xs mt-2">
                  <p>
                    ✅ <strong>{uploadSummary.created}</strong> books created,
                    <strong> {uploadSummary.skipped || 0}</strong> skipped.
                  </p>
                  {uploadSummary.failed && (
                    <p className="text-red-600">
                      ⚠️ {uploadSummary.failed} failed entries.
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`px-3 py-1.5 text-xs text-white rounded-md ${
                    uploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {uploading ? "Uploading..." : "⬆️ Upload"}
                </button>

                <button
                  onClick={handleTemplateDownload}
                  className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  📄 Template
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
