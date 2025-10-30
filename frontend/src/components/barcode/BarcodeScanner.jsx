// src/components/barcode/BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

const BarcodeScanner = ({ onDetected }) => {
  const videoRef = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let selectedDeviceId = null;

    const startScan = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) throw new Error("No camera devices found");

        selectedDeviceId = devices[0].deviceId;

        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (result) {
              setIsActive(false);
              onDetected(result.getText());
              codeReader.reset();
            }
            if (err && !(err.name === "NotFoundException")) {
              console.warn(err);
            }
          }
        );
      } catch (err) {
        console.error(err);
        setError("Camera access denied or unavailable.");
      }
    };

    if (isActive) startScan();

    return () => {
      codeReader.reset();
    };
  }, [isActive, onDetected]);

  return (
    <div className="w-full text-center">
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <video ref={videoRef} className="mx-auto rounded-lg shadow-md w-full max-w-md" />
      )}
      {!isActive && (
        <button
          onClick={() => setIsActive(true)}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Restart Scan
        </button>
      )}
    </div>
  );
};

export default BarcodeScanner;
