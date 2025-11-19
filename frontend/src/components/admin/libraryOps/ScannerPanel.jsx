// src/components/admin/libraryOps/ScannerPanel.jsx
import React, { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";

export default function ScannerPanel({ onDetected }) {
  const [scanning, setScanning] = useState(false);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {!scanning ? (
        <>
          <button
            onClick={() => setScanning(true)}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            Start Scan
          </button>
          <div className="text-xs text-gray-500">
            Camera will auto-close after detecting a barcode.
          </div>
        </>
      ) : (
        <>
          <div className="w-full max-w-[340px] mx-auto border rounded-xl overflow-hidden shadow">
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
              className="px-4 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
            <button
              onClick={() => setScanning(true)}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Rescan
            </button>
          </div>
        </>
      )}
    </div>
  );
}
