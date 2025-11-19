// src/components/admin/libraryOps/ScanResultCard.jsx
import React from "react";

const ScanResultCard = ({ data = {} }) => {
  if (!data) return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 w-full">
      <h2 className="text-lg font-semibold mb-3 text-blue-700">Book Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Field label="Book Code" value={data.book_code} />
        <Field label="ID" value={data.id} />
        <Field label="Title" value={data.title} wide />
        <Field label="Author" value={data.author} />
        <Field label="Category" value={data.category} />
        <Field label="Shelf" value={data.shelf_location} />
        <Field label="Status" value={data.status} />
        <Field label="Issued To" value={data.issued_to} />
        <Field label="Due Date" value={data.due_date} />

        {/* Additional metadata */}
        <Field label="Publisher" value={data.publisher} />
        <Field label="Edition" value={data.edition} />
        <Field label="ISBN" value={data.isbn} />
        <Field label="Language" value={data.language} />
        <Field label="Publication Year" value={data.publication_year} />
      </div>
    </div>
  );
};

function Field({ label, value, wide }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium text-gray-800">{value || "—"}</div>
    </div>
  );
}

export default ScanResultCard;
