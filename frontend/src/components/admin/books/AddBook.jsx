// src/components/admin/books/AddBook.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { addBook } from "../../../api/libraryApi";
import Loader from "../../common/Loader";

export default function AddBook({ onClose, onAdded }) {
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    author: "",
    publisher: "",
    edition: "",
    publication_year: "",
    isbn: "",
    category: "",
    language: "",
    keywords: "",
    description: "",
    quantity: 1,
    shelf_location: "",
    condition: "Good",
    availability_status: "Available",
    book_cost: "",
    vendor_name: "",
    source: "",
    accession_number: "",
    library_section: "",
    dewey_decimal: "",
    cataloger: "",
    remarks: "",
    is_active: true,
  });

  const [coverPreview, setCoverPreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const categories = [
    "Electronics", "Telecommunication", "Embedded Systems", "Programming", "C & C++",
    "Python", "Engineering Mathematics", "Signal Processing", "Networking",
    "Microcontrollers", "IoT", "Project Management", "Machine Learning", "Digital Design",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.category) {
      toast.error("⚠️ Title, Author, and Category are required!");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null) formData.append(key, value);
      });
      if (coverImage) formData.append("cover_image", coverImage);

      // Use centralized API helper to capture progress and ensure correct endpoint
      await addBook(formData, (event) => {
        const percent = Math.round((event.loaded * 100) / event.total);
        setProgress(percent);
      });

      toast.success("✅ Book added successfully!");
      setProgress(100);
      setTimeout(() => {
        onAdded?.();
        onClose?.();
      }, 800);

      setForm({
        title: "", subtitle: "", author: "", publisher: "", edition: "", publication_year: "",
        isbn: "", category: "", language: "", keywords: "", description: "",
        quantity: 1, shelf_location: "", condition: "Good", availability_status: "Available",
        book_cost: "", vendor_name: "", source: "", accession_number: "",
        library_section: "", dewey_decimal: "", cataloger: "", remarks: "", is_active: true,
      });
      setCoverImage(null);
      setCoverPreview(null);
    } catch (err) {
      console.error("AddBook error:", err.response?.data || err.message);
      toast.error("❌ Failed to add book. Please check required fields.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start py-8 z-50 overflow-y-auto">
      {loading && <Loader overlay />}
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-5 relative">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-blue-700">➕ Add New Book</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Upload Progress Bar */}
        {progress > 0 && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">{progress}%</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="title" placeholder="Title *" value={form.title} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="subtitle" placeholder="Subtitle" value={form.subtitle} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="author" placeholder="Author *" value={form.author} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="publisher" placeholder="Publisher" value={form.publisher} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="edition" placeholder="Edition" value={form.edition} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="publication_year" placeholder="Publication Year" value={form.publication_year} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="isbn" placeholder="ISBN" value={form.isbn} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <select name="category" value={form.category} onChange={handleChange} className="border rounded-md px-2 py-1.5">
              <option value="">Select Category *</option>
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Inventory Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="language" placeholder="Language" value={form.language} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="keywords" placeholder="Keywords" value={form.keywords} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="shelf_location" placeholder="Shelf Location" value={form.shelf_location} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="condition" placeholder="Condition" value={form.condition} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="availability_status" placeholder="Availability" value={form.availability_status} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
          </div>

          {/* Finance & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="number" name="book_cost" placeholder="Book Cost (₹)" value={form.book_cost} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="vendor_name" placeholder="Vendor" value={form.vendor_name} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="source" placeholder="Source (Donation / Purchase)" value={form.source} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
          </div>

          {/* Cataloging */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="accession_number" placeholder="Accession No." value={form.accession_number} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="library_section" placeholder="Library Section" value={form.library_section} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="dewey_decimal" placeholder="Dewey Decimal" value={form.dewey_decimal} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
            <input name="cataloger" placeholder="Cataloger" value={form.cataloger} onChange={handleChange} className="border rounded-md px-2 py-1.5" />
          </div>

          <textarea name="description" placeholder="Description / Summary" value={form.description} onChange={handleChange} rows="2" className="w-full border rounded-md px-2 py-1.5"></textarea>
          <textarea name="remarks" placeholder="Remarks" value={form.remarks} onChange={handleChange} rows="2" className="w-full border rounded-md px-2 py-1.5"></textarea>

          {/* Cover Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1">
              <label className="block text-gray-600 text-sm mb-1">Cover Image:</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="border rounded-md px-2 py-1.5 w-full" />
            </div>
            {coverPreview && <img src={coverPreview} alt="Preview" className="w-20 h-28 object-cover rounded-md border" />}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-3">
            <button type="button" onClick={onClose} className="px-4 py-1.5 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
              {loading ? "Adding..." : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
