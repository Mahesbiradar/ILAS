// src/components/admin/libraryOps/ManualScanInput.jsx
import React, { useState } from "react";

const ManualScanInput = ({ onSubmit }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter book code (e.g. ILAS-ET-0001)"
        className="w-full max-w-md border rounded px-3 py-2"
      />
      <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Lookup</button>
    </form>
  );
};

export default ManualScanInput;
