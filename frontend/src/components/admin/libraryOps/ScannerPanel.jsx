// src/components/admin/libraryOps/ScannerPanel.jsx
import React, { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";

/**
 * ScannerPanel
 * - Shows Start Scan button
 * - Shows camera preview (small) only when scanning
 * - Auto-close handled by child (BarcodeScanner will call onDetected once)
 */
export default function ScannerPanel({ onDetected }) {
  const [scanning, setScanning] = useState(false);

  return (
    <div>
      {!scanning ? (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setScanning(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Start Scan
          </button>
          <div className="text-xs text-gray-500">Click to open camera (will auto-close on detection)</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-full max-w-[340px] mx-auto border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
            <BarcodeScanner
              onDetected={(code) => {
                setScanning(false);
                onDetected(code);
              }}
              previewWidth={320}
              previewHeight={220}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setScanning(false)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Close
            </button>
            <button
              onClick={() => {
                // simply keep scanning (re-open)
                setScanning(true);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Rescan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
