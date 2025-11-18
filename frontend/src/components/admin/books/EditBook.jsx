// src/components/admin/books/EditBook.jsx
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { editBook } from "../../../api/libraryApi";
import Loader from "../../common/Loader";

export default function EditBook({ book, onSubmit, onClose }) {
  const [form, setForm] = useState({});
  const [newCover, setNewCover] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-2 py-1.5 text-sm w-full transition";
  const labelClass = "text-xs font-medium text-gray-600";

  useEffect(() => {
    if (book) {
      setForm(book);
      setPreview(book.cover_image || null);
    }
  }, [book]);

  if (!book) return null;

  const categories = [
    "Electronics", "Telecommunication", "Embedded Systems", "Programming", "C & C++",
    "Python", "Engineering Mathematics", "Signal Processing", "Networking",
    "Microcontrollers", "IoT", "Project Management", "Machine Learning", "Digital Design",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCover(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.author) {
      toast.error("⚠️ Title and Author required!");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "cover_image" && v != null && v !== "") fd.append(k, v);
      });
      if (newCover) fd.append("cover_image", newCover);

      const id = form.id || book.id;
      await editBook(id, fd);

      toast.success("✏️ Book updated!");
      onSubmit?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error("❌ Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start py-6 z-50 overflow-y-auto">
      {loading && <Loader overlay />}

      <div className="bg-white w-full max-w-xl rounded-xl shadow-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-yellow-700">✏️ Edit Book</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-red-600 text-xl font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} name="title" value={form.title || ""} onChange={handleChange} />
          </div>

          {/* Double Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div>
              <label className={labelClass}>Subtitle</label>
              <input className={inputClass} name="subtitle" value={form.subtitle || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Author *</label>
              <input className={inputClass} name="author" value={form.author || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Publisher</label>
              <input className={inputClass} name="publisher" value={form.publisher || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Edition</label>
              <input className={inputClass} name="edition" value={form.edition || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Publication Year</label>
              <input className={inputClass} name="publication_year" value={form.publication_year || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>ISBN</label>
              <input className={inputClass} name="isbn" value={form.isbn || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <select className={inputClass} name="category" value={form.category || ""} onChange={handleChange}>
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Language</label>
              <input className={inputClass} name="language" value={form.language || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Keywords</label>
              <input className={inputClass} name="keywords" value={form.keywords || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Shelf Location</label>
              <input className={inputClass} name="shelf_location" value={form.shelf_location || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Condition</label>
              <input className={inputClass} name="condition" value={form.condition || ""} onChange={handleChange} />
            </div>
          </div>

          {/* Cataloging */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Accession Number</label>
              <input className={inputClass} name="accession_number" value={form.accession_number || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Library Section</label>
              <input className={inputClass} name="library_section" value={form.library_section || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Dewey Decimal</label>
              <input className={inputClass} name="dewey_decimal" value={form.dewey_decimal || ""} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Cataloger</label>
              <input className={inputClass} name="cataloger" value={form.cataloger || ""} onChange={handleChange} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass} rows={2} name="description" value={form.description || ""} onChange={handleChange} />
          </div>

          {/* Remarks */}
          <div>
            <label className={labelClass}>Remarks</label>
            <textarea className={inputClass} rows={2} name="remarks" value={form.remarks || ""} onChange={handleChange} />
          </div>

          {/* Cover Upload */}
          <div>
            <label className={labelClass}>Cover Image</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="file" accept="image/*" onChange={handleCoverChange} className={inputClass} />
              {preview && <img src={preview} className="w-16 h-24 rounded border object-cover" />}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
