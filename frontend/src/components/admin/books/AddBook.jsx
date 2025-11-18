// src/components/admin/books/AddBook.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
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

  const categories = [
    "Electronics", "Telecommunication", "Embedded Systems", "Programming", "C & C++",
    "Python", "Engineering Mathematics", "Signal Processing", "Networking",
    "Microcontrollers", "IoT", "Project Management", "Machine Learning", "Digital Design",
  ];

  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const inputClass =
    "border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md px-2 py-1.5 text-sm w-full transition";

  const labelClass = "text-xs font-medium text-gray-600";

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleCoverChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setCoverImage(f);
      setCoverPreview(URL.createObjectURL(f));
    }
  };

  const resetForm = () => {
    setForm({
      ...form,
      title: "",
      author: "",
      category: "",
    });
    setCoverImage(null);
    setCoverPreview(null);
    setProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.category) {
      toast.error("⚠️ Title, Author, and Category are required!");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== "" && val != null) fd.append(key, val);
      });
      if (coverImage) fd.append("cover_image", coverImage);

      await addBook(fd, (ev) => {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      });

      toast.success("📚 Book added!");
      onAdded?.();
      resetForm();
      setTimeout(onClose, 300);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to add book.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-start py-6 overflow-y-auto">
      {loading && <Loader overlay />}

      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-5 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-blue-700">➕ Add New Book</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-red-600 text-xl font-bold">
            ✕
          </button>
        </div>

        {/* Upload Progress */}
        {progress > 0 && (
          <div className="w-full mb-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-600 text-right mt-1">{progress}%</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Title Row */}
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} name="title" value={form.title} onChange={handleChange} />
          </div>

          {/* Double Column Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Subtitle</label>
              <input className={inputClass} name="subtitle" value={form.subtitle} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Author *</label>
              <input className={inputClass} name="author" value={form.author} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Publisher</label>
              <input className={inputClass} name="publisher" value={form.publisher} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Edition</label>
              <input className={inputClass} name="edition" value={form.edition} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Publication Year</label>
              <input className={inputClass} name="publication_year" value={form.publication_year} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>ISBN</label>
              <input className={inputClass} name="isbn" value={form.isbn} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <select className={inputClass} name="category" value={form.category} onChange={handleChange}>
                <option value="">Choose Category *</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Language</label>
              <input className={inputClass} name="language" value={form.language} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Keywords</label>
              <input className={inputClass} name="keywords" value={form.keywords} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Shelf Location</label>
              <input className={inputClass} name="shelf_location" value={form.shelf_location} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Condition</label>
              <input className={inputClass} name="condition" value={form.condition} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Accession No.</label>
              <input className={inputClass} name="accession_number" value={form.accession_number} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Library Section</label>
              <input className={inputClass} name="library_section" value={form.library_section} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Dewey Decimal</label>
              <input className={inputClass} name="dewey_decimal" value={form.dewey_decimal} onChange={handleChange} />
            </div>

            <div>
              <label className={labelClass}>Cataloger</label>
              <input className={inputClass} name="cataloger" value={form.cataloger} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea className={inputClass} rows={2} name="description" value={form.description} onChange={handleChange} />
          </div>

          <div>
            <label className={labelClass}>Remarks</label>
            <textarea className={inputClass} rows={2} name="remarks" value={form.remarks} onChange={handleChange} />
          </div>

          {/* Cover Upload */}
          <div>
            <label className={labelClass}>Cover Image</label>
            <div className="flex items-center gap-3 mt-1">
              <input type="file" accept="image/*" onChange={handleCoverChange} className={inputClass} />
              {coverPreview && (
                <img src={coverPreview} className="w-16 h-24 object-cover rounded border" />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
