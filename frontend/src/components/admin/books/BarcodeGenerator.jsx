import React, { useState, useRef } from "react";
import { Button } from "../../common";
import toast from "react-hot-toast";

// Small Barcode Generator using JsBarcode (optional dependency)
export default function BarcodeGenerator() {
  const [input, setInput] = useState("");
  const [codes, setCodes] = useState([]);
  const containerRef = useRef(null);

  const parseInput = () => {
    // Accept CSV (one per line) or range like BOOK-1..BOOK-10
    const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const out = [];
    lines.forEach((l) => {
      const rangeMatch = l.match(/(.+?)\s*\.\.\s*(.+)/);
      if (rangeMatch) {
        const start = rangeMatch[1];
        const end = rangeMatch[2];
        // If numeric suffixes, try to expand
        const numMatch = start.match(/(.*?)(\d+)$/);
        const numMatch2 = end.match(/(.*?)(\d+)$/);
        if (numMatch && numMatch2 && numMatch[1] === numMatch2[1]) {
          const prefix = numMatch[1];
          const a = parseInt(numMatch[2], 10);
          const b = parseInt(numMatch2[2], 10);
          const step = a <= b ? 1 : -1;
          for (let i = a; step > 0 ? i <= b : i >= b; i += step) {
            out.push(prefix + i);
          }
          return;
        }
      }
      out.push(l);
    });
    setCodes(out.slice(0, 200)); // limit preview
  };

  const renderBarcodes = async () => {
    try {
      const pkgName = "js" + "barcode";
      const imported = await import(/* @vite-ignore */ pkgName);
      const JsBarcode = (imported && (imported.default || imported));
      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = "";
      codes.forEach((c) => {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("jsbarcode-format", "CODE128");
        svg.setAttribute("jsbarcode-value", c);
        svg.setAttribute("width", "200");
        svg.setAttribute("height", "60");
        container.appendChild(svg);
        try {
          // eslint-disable-next-line no-undef
          JsBarcode(svg, c, { format: "CODE128", displayValue: true, height: 40 });
        } catch (err) {
          console.warn("JsBarcode render failed:", err);
        }
      });
    } catch (err) {
      console.warn("JsBarcode not installed or failed to load:", err && err.message ? err.message : err);
      toast.error("JsBarcode library not available. Install 'jsbarcode' to enable previews.");
    }
  };

  const downloadAll = async () => {
    const container = containerRef.current;
    if (!container) return;
    const svgs = Array.from(container.querySelectorAll("svg"));
    for (let i = 0; i < svgs.length; i++) {
      const svg = svgs[i];
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${codes[i] || i}.svg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });

  const downloadPDF = async () => {
    const container = containerRef.current;
    if (!container) return;
    const svgs = Array.from(container.querySelectorAll("svg"));
    if (svgs.length === 0) {
      toast.error("No barcodes to export. Render preview first.");
      return;
    }

    setPdfLoading(true);
    setPdfProgress({ current: 0, total: svgs.length });

    try {
      const pkgName = "js" + "pdf";
      const pkg = await import(/* @vite-ignore */ pkgName);
      const { jsPDF } = pkg;
      const pdf = new jsPDF("p", "pt", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 20;

      for (let i = 0; i < svgs.length; i++) {
        const svg = svgs[i];
        const xml = new XMLSerializer().serializeToString(svg);
        const svgData = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

        // Load SVG into an Image then draw to canvas to get PNG
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = svgData;

        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(new Error("Failed to load SVG image"));
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width || 400;
        canvas.height = img.height || 120;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = canvas.toDataURL("image/png");

        // Calculate scaled width to fit page with 40pt margin
        const margin = 40;
        const maxW = pageW - margin * 2;
        const scale = Math.min(1, maxW / canvas.width);
        const drawW = canvas.width * scale;
        const drawH = canvas.height * scale;

        if (y + drawH > pageH - margin) {
          pdf.addPage();
          y = 20;
        }

        pdf.addImage(imgData, "PNG", margin, y, drawW, drawH);
        y += drawH + 10;

        setPdfProgress({ current: i + 1, total: svgs.length });
      }

      pdf.save("barcodes.pdf");
      toast.success("PDF exported");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error(err.message || "PDF export failed");
    } finally {
      setPdfLoading(false);
      setPdfProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Barcode Generator (Preview)</h2>
      <p className="text-sm text-gray-600 mb-3">Enter one code per line or ranges like <code>BOOK-1..BOOK-10</code></p>
      <textarea
        rows={6}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full border p-3 rounded-md mb-3"
        placeholder="BOOK-1\nBOOK-2\nBOOK-100..BOOK-110"
      />
      <div className="flex gap-2 mb-4">
        <Button onClick={parseInput}>Parse</Button>
        <Button onClick={renderBarcodes}>Render Preview</Button>
        <Button onClick={downloadAll}>Download SVGs</Button>
        <Button onClick={downloadPDF} disabled={pdfLoading}>
          {pdfLoading ? `Exporting (${pdfProgress.current}/${pdfProgress.total})` : "Download PDF"}
        </Button>
      </div>

      <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
    </div>
  );
}
