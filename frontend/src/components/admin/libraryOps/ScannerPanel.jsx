// src/components/admin/libraryOps/ScannerPanel.jsx
import React, { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";

/**
 * Compact scanner panel: small preview and controls.
 * Props:
 *  - onDetected(code)
 */
export default function ScannerPanel({ onDetected }) {
  const [scanning, setScanning] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {!scanning ? (
        <>
          <button
            onClick={() => setScanning(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Start Scan
          </button>
          <div className="text-xs text-gray-500 text-center">
            Camera will auto-close after detecting a barcode.
          </div>
        </>
      ) : (
        <>
          <div className="w-full max-w-[360px] mx-auto border rounded-lg overflow-hidden shadow">
            <BarcodeScanner
              onDetected={(code) => {
                setScanning(false);
                onDetected(code);
              }}
              previewWidth={320}
              previewHeight={220}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setScanning(false)}
              className="px-3 py-1 bg-gray-200 rounded-lg"
            >
              Close
            </button>
            <button
              onClick={() => setScanning(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg"
            >
              Rescan
            </button>
          </div>
        </>
      )}
    </div>
  );
}
