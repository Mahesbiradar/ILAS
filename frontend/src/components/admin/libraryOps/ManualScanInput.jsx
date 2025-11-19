// src/components/admin/libraryOps/ManualScanInput.jsx
import React, { useState } from "react";

const ManualScanInput = ({ onSubmit }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4 w-full max-w-md">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter Book Code (e.g., ILAS-ET-0001)"
        className="border rounded-lg px-3 py-2 text-sm focus:ring focus:ring-blue-200"
      />
      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
        Lookup
      </button>
    </form>
  );
};

export default ManualScanInput;
