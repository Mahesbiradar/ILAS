import React, { useState } from "react";
import { Button } from "../../common";
import toast from "react-hot-toast";
import { generateBarcodesPDF } from "../../../api/libraryApi";

export default function BarcodeGenerator() {
  const [input, setInput] = useState("");
  const [pageSize, setPageSize] = useState("A4"); // ✅ NEW
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error("Please paste at least one book entry.");
      return;
    }

    try {
      setLoading(true);

      // ✅ Pass page size
      const res = await generateBarcodesPDF(input, pageSize);

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `barcodes_${pageSize}.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Barcode PDF (${pageSize}) downloaded`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate barcode PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">
        Bulk Barcode Generator
      </h2>

      <p className="text-sm text-gray-600 mb-3">
        Paste one book per line.<br />
        <strong>Format:</strong> <code>BOOK_ID Book Title</code>
      </p>

      {/* ✅ Page Size Selector */}
      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm font-medium">Page Size:</label>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="A4">A4</option>
          <option value="A3">A3 (12 × 18 inch)</option>
        </select>
      </div>

      <textarea
        rows={8}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full border border-gray-300 rounded-md p-3 mb-4 text-sm focus:ring-2 focus:ring-blue-500"
        placeholder={`LAS-ET-0001 Signals and Systems Vol-1
LAS-ET-0002 Digital Signal Processing
LAS-ET-0003 Control Systems Engineering`}
      />

      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating PDF..." : "Generate & Download PDF"}
      </Button>
    </div>
  );
}
