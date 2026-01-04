// src/components/admin/libraryOps/ScannerPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import BarcodeScanner from "./BarcodeScanner";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, RefreshCw } from "lucide-react";

/**
 * Compact scanner panel: small preview and controls.
 * Props:
 *  - onDetected(code)
 */
export default function ScannerPanel({ onDetected }) {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Load devices on mount
  useEffect(() => {
    let mounted = true;
    const loadDevices = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (mounted && videoInputDevices.length > 0) {
          setDevices(videoInputDevices);
          // Default to back camera if available
          const backCamera = videoInputDevices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
          );
          setSelectedDeviceId(backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Failed to list video devices", err);
      }
    };
    loadDevices();
    return () => { mounted = false; };
  }, []);

  const handleSwitchCamera = () => {
    if (devices.length < 2) return;

    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {!scanning ? (
        <>
          <button
            onClick={() => setScanning(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 flex items-center gap-2"
          >
            <Camera size={18} />
            Start Scan
          </button>
          <div className="text-xs text-gray-500 text-center">
            Camera will auto-close after detecting a barcode.
          </div>
        </>
      ) : (
        <>
          <div className="w-full max-w-[360px] mx-auto border rounded-lg overflow-hidden shadow relative bg-black">
            <BarcodeScanner
              deviceId={selectedDeviceId}
              onDetected={(code) => {
                setScanning(false);
                onDetected(code);
              }}
              previewWidth="100%"
              previewHeight={220}
            />

            {/* Camera Switcher Overlay */}
            {devices.length > 1 && (
              <button
                onClick={handleSwitchCamera}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                title="Switch Camera"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setScanning(false)}
              className="px-3 py-1 bg-gray-200 rounded-lg text-sm hover:bg-gray-300 transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Force re-mount or just ensure active
                setScanning(false);
                setTimeout(() => setScanning(true), 10);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Rescan
            </button>
          </div>
        </>
      )}
    </div>
  );
}
