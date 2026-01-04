// src/components/admin/libraryOps/BarcodeScanner.jsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

const BarcodeScanner = ({ onDetected, deviceId, previewWidth = 300, previewHeight = 200 }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef(null);

  // Helper to stop all video tracks
  const stopMediaStream = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const startDecoding = async () => {
      stopMediaStream(); // Ensure any previous stream is closed

      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();

        let selectedDeviceId = deviceId;
        if (!selectedDeviceId && videoInputDevices.length > 0) {
          // If no specific device requested, try to find the "back" camera on mobile
          const backCamera = videoInputDevices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
          );
          selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
        }

        if (!selectedDeviceId) {
          throw new Error("No camera found");
        }

        if (!mounted) return;

        // Start decoding from the specific device
        controlsRef.current = await codeReader.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (!mounted) return;
            if (result) {
              stopMediaStream(); // Stop immediately on detection
              onDetected(result.getText());
            }
          }
        );

      } catch (err) {
        if (mounted) {
          console.error(err);
          setError("Camera error: " + (err.message || "Unknown error"));
        }
      }
    };

    startDecoding();

    return () => {
      mounted = false;
      stopMediaStream();
    };
  }, [deviceId, onDetected]);

  return (
    <div className="flex flex-col items-center">
      {error ? (
        <div className="text-sm text-red-500 p-4">{error}</div>
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
          muted
        />
      )}
    </div>
  );
};

export default BarcodeScanner;
