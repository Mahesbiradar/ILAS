// src/components/admin/libraryOps/BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

/**
 * Props:
 * - onDetected(code)   // called when barcode found
 * - previewWidth (optional)
 * - previewHeight (optional)
 *
 * This component auto-stops scanning when a code is found.
 */
const BarcodeScanner = ({ onDetected, previewWidth = 320, previewHeight = 220 }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    let mounted = true;
    let codeReader = null;

    const start = async () => {
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera not supported.");
        }

        codeReader = new BrowserMultiFormatReader();

        // list devices
        const devices = typeof BrowserMultiFormatReader.listVideoInputDevices === "function"
          ? await BrowserMultiFormatReader.listVideoInputDevices()
          : [];

        if (!devices || devices.length === 0) {
          throw new Error("No camera found.");
        }

        const deviceId = devices[0].deviceId;

        if (!videoRef.current) return;

        codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (!mounted) return;
          if (result) {
            try {
              // stop scanning
              codeReader && codeReader.reset();
            } catch (e) {}
            setActive(false);
            try {
              onDetected(result.getText());
            } catch (e) {
              console.error("onDetected handler error", e);
            }
          }
          if (err && err.name !== "NotFoundException") {
            // non-critical
            console.warn(err);
          }
        });
      } catch (e) {
        if (!mounted) return;
        console.warn("Scanner error:", e);
        setError(e.message || "Camera unavailable");
      }
    };

    if (active) start();

    return () => {
      mounted = false;
      try {
        codeReader && codeReader.reset();
      } catch (e) {}
    };
  }, [active, onDetected]);

  return (
    <div className="flex flex-col items-center">
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <video
          ref={videoRef}
          style={{
            width: previewWidth,
            height: previewHeight,
            objectFit: "cover",
            borderRadius: 8,
          }}
          className="mx-auto"
        />
      )}
    </div>
  );
};

export default BarcodeScanner;
