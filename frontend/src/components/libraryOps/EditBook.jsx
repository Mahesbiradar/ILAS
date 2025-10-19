// src/components/libraryOps/EditBook.jsx
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function EditBook({ selectedBook, onUpdate, onCancel }) {
  const [form, setForm] = useState(selectedBook || {});

  useEffect(() => {
    setForm(selectedBook || {});
  }, [selectedBook]);

  if (!selectedBook) return null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form);
    toast.success(`Updated "${form.title}" successfully!`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold text-yellow-700 mb-4">
        ✏️ Edit Book
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["title", "author", "isbn", "category", "publication", "edition"].map(
          (field) => (
            <input
              key={field}
              name={field}
              placeholder={field.replace("_", " ").toUpperCase()}
              value={form[field] || ""}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-yellow-500 outline-none"
            />
          )
        )}
        <input
          type="number"
          name="quantity"
          min="1"
          value={form.quantity || 1}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-yellow-500 outline-none"
        />
        <button
          type="submit"
          className="md:col-span-3 bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="md:col-span-3 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
