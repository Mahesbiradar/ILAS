// src/components/barcode/ManualScanInput.jsx
import React, { useState } from "react";

const ManualScanInput = ({ onSubmit }) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      <input
        type="text"
        placeholder="Enter barcode manually"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border rounded-lg px-3 py-2 w-64"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Submit
      </button>
    </div>
  );
};

export default ManualScanInput;
