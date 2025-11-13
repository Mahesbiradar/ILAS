// src/components/admin/books/EditBook.jsx
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { editBook } from "../../../api/libraryApi";
import Loader from "../../common/Loader";

export default function EditBook({ book, onSubmit, onClose }) {
  const [form, setForm] = useState(book || {});
  const [newCover, setNewCover] = useState(null);
  const [preview, setPreview] = useState(book?.cover_image || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(book || {});
    setPreview(book?.cover_image || null);
  }, [book]);

  if (!book) return null;

  const categories = [
    "Electronics",
    "Telecommunication",
    "Embedded Systems",
    "Programming",
    "C & C++",
    "Python",
    "Engineering Mathematics",
    "Signal Processing",
    "Networking",
    "Microcontrollers",
    "IoT",
    "Project Management",
    "Machine Learning",
    "Digital Design",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCover(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.author) {
      toast.error("⚠️ Title and Author are required!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) return;
        if (key === "quantity") return; // 🚫 Quantity is locked — handled via copies
        if (key !== "cover_image") formData.append(key, value);
      });

      if (newCover instanceof File) formData.append("cover_image", newCover);

      await editBook(form.book_code, formData);
      toast.success("✅ Book updated successfully!");
      onSubmit?.();
      onClose?.();
    } catch (err) {
      console.error("Error updating book:", err.response?.data || err.message);
      toast.error(
        err.response?.data?.cover_image
          ? "Invalid cover image selected."
          : "Failed to update book. Check required fields."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto">
      {loading && <Loader overlay />}
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-yellow-700">✏️ Edit Book</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Book Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="title" placeholder="Title *" value={form.title || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="subtitle" placeholder="Subtitle" value={form.subtitle || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="author" placeholder="Author *" value={form.author || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="publisher" placeholder="Publisher" value={form.publisher || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="edition" placeholder="Edition" value={form.edition || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="publication_year" placeholder="Publication Year" value={form.publication_year || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="isbn" placeholder="ISBN" value={form.isbn || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <select name="category" value={form.category || ""} onChange={handleChange} className="border rounded-lg px-3 py-2">
              <option value="">Select Category *</option>
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
            <input name="language" placeholder="Language" value={form.language || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="keywords" placeholder="Keywords" value={form.keywords || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
          </div>

          {/* Inventory Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="shelf_location" placeholder="Shelf Location" value={form.shelf_location || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="condition" placeholder="Condition" value={form.condition || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="availability_status" placeholder="Availability" value={form.availability_status || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input type="number" name="book_cost" placeholder="Book Cost (₹)" value={form.book_cost || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="vendor_name" placeholder="Vendor Name" value={form.vendor_name || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="source" placeholder="Source (Donation / Purchase)" value={form.source || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
          </div>

          {/* Cataloging Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="accession_number" placeholder="Accession Number" value={form.accession_number || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="library_section" placeholder="Library Section" value={form.library_section || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="dewey_decimal" placeholder="Dewey Decimal" value={form.dewey_decimal || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
            <input name="cataloger" placeholder="Cataloger" value={form.cataloger || ""} onChange={handleChange} className="border rounded-lg px-3 py-2" />
          </div>

          {/* Textareas */}
          <textarea name="description" placeholder="Description / Summary" value={form.description || ""} onChange={handleChange} rows="3" className="w-full border rounded-lg px-3 py-2"></textarea>
          <textarea name="remarks" placeholder="Remarks" value={form.remarks || ""} onChange={handleChange} rows="2" className="w-full border rounded-lg px-3 py-2"></textarea>

          {/* Cover Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <label className="block text-gray-600 font-medium mb-1">Cover Image:</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="border rounded-lg px-3 py-2 w-full" />
            </div>
            {preview && (
              <div className="flex-shrink-0">
                <img src={preview} alt="Preview" className="w-24 h-32 object-cover rounded-lg border" />
              </div>
            )}
          </div>

          {/* Quantity (Locked) */}
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Quantity (Locked)
            </label>
            <input
              type="number"
              name="quantity"
              value={form.quantity || 0}
              readOnly
              disabled
              className="border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              ⚙️ Quantity is managed automatically via copy-level operations.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`px-5 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
