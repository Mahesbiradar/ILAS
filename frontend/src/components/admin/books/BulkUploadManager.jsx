// src/components/admin/books/BulkUploadManager.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { bulkUploadBooks } from "../../../api/libraryApi";
import { motion, AnimatePresence } from "framer-motion";

export default function BulkUploadManager({ onUploaded }) {
  const [show, setShow] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSummary, setUploadSummary] = useState(null);

  const handleFileChange = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) setter(file);
  };

  const handleUpload = async () => {
    if (!excelFile) {
      toast.error("⚠️ Please select an Excel (.xlsx) file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", excelFile);
    if (zipFile) formData.append("images", zipFile);

    try {
      setUploading(true);
      setProgress(0);
      setUploadSummary(null);

      // Warning user about time
      if (zipFile) {
        toast("⏳ Uploading images... this may take a few minutes.", { icon: "🕒", duration: 5000 });
      }

      // Pass high timeout config implicitly by ensuring backend handles it 
      // or relying on browser default. Ideally API function allows config injection.
      const response = await bulkUploadBooks(formData, (evt) => {
        const percent = Math.round((evt.loaded / evt.total) * 100);
        setProgress(percent);
      });

      setProgress(100);

      const created = response.created || 0;
      const failed = response.failed || 0;

      if (failed > 0) {
        toast.error(`⚠️ Uploaded ${created}, Failed ${failed}`);
      } else {
        toast.success(`🎉 All ${created} books uploaded!`);
      }

      setUploadSummary(response);
      onUploaded?.();

      if (failed === 0) {
        setTimeout(() => {
          setExcelFile(null);
          setZipFile(null);
          setProgress(0);
          setShow(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      // Show actual server error if available
      const backendErr = err.response?.data?.detail || err.response?.data?.error;
      console.error("BACKEND RESPONSE:", err.response?.data);
      const msg = backendErr || "Upload failed. Server Error.";
      toast.error(`❌ ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateClick = () => {
    toast("📄 Template download not configured.", { icon: "ℹ️" });
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md transition"
      >
        📦 Bulk Upload
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md">
          {show ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-xl shadow-xl w-96 p-4"
          >
            <h3 className="text-gray-700 font-semibold text-sm mb-2">
              📤 Upload Books in Bulk
            </h3>

            <div className="space-y-3 text-xs">
              {/* Excel File */}
              <div>
                <label className="font-medium text-gray-600">Excel File (.xlsx)</label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => handleFileChange(e, setExcelFile)}
                  className="w-full border rounded-md px-2 py-1 mt-1"
                />
              </div>

              {/* ZIP File */}
              <div>
                <label className="font-medium text-gray-600">Cover Images ZIP (Optional)</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => handleFileChange(e, setZipFile)}
                  className="w-full border rounded-md px-2 py-1 mt-1"
                />
                <p className="text-gray-400 mt-1 italic">
                  Images matched by ISBN.jpg or Title.jpg
                </p>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-gray-500 text-right mt-1">{progress}%</p>
                </div>
              )}

              {/* Summary */}
              {uploadSummary && !uploading && (
                <div className={`p-2 rounded-md border ${uploadSummary.failed > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                  }`}>
                  <p className="text-green-700 font-bold mb-1">
                    ✔ Created: {uploadSummary.created || 0}
                  </p>

                  {uploadSummary.failed > 0 && (
                    <div className="mt-2">
                      <p className="text-red-600 font-bold">
                        ⚠ Failed: {uploadSummary.failed}
                      </p>
                      <div className="mt-1 h-32 overflow-y-auto bg-white border border-red-100 rounded p-1">
                        {uploadSummary.errors?.map((err, idx) => (
                          <div key={idx} className="text-red-500 mb-1 border-b border-gray-50 pb-1">
                            <span className="font-semibold">Row {err.row}:</span> {err.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`px-3 py-1.5 text-xs text-white rounded-md ${uploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {uploading ? "Uploading..." : "⬆ Upload"}
                </button>

                <button
                  onClick={handleTemplateClick}
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
