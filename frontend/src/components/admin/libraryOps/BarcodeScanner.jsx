// src/components/admin/libraryOps/BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

const BarcodeScanner = ({ onDetected, previewWidth = 300, previewHeight = 200 }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    let mounted = true;
    let codeReader = null;

    const start = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("Camera not supported.");
        }

        codeReader = new BrowserMultiFormatReader();
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();

        if (!devices || devices.length === 0) throw new Error("No camera found.");

        const deviceId = devices[0].deviceId;
        if (!videoRef.current) return;

        codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (!mounted) return;

          if (result) {
            try { codeReader.reset(); } catch {}
            setActive(false);
            onDetected(result.getText());
          }

          if (err && err.name !== "NotFoundException") {
            console.warn(err);
          }
        });
      } catch (e) {
        if (!mounted) return;
        setError(e.message || "Camera unavailable");
      }
    };

    if (active) start();

    return () => {
      mounted = false;
      try { codeReader && codeReader.reset(); } catch {}
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
            borderRadius: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        />
      )}
    </div>
  );
};

export default BarcodeScanner;
