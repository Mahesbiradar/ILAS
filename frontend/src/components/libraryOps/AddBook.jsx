// src/components/libraryOps/AddBook.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { addBook } from "../../api/libraryApi";
import Loader from "../common/Loader";

export default function AddBook({ onClose, onAdded }) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    publisher: "",
    publication: "",
    edition: "",
    shelf_number: "",
    description: "",
    quantity: 1,
    published_date: "",
  });

  const [coverPreview, setCoverPreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

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
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      toast.error("Title, Author, and Category are required!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value === "" || value === null) return;

        if (key === "quantity") formData.append(key, parseInt(value, 10));
        else if (key === "published_date" && value)
          formData.append(key, new Date(value).toISOString().split("T")[0]);
        else formData.append(key, value);
      });

      if (coverImage) formData.append("cover_image", coverImage);

      await addBook(formData);
      toast.success("📘 Book added successfully!");
      onAdded?.();
      onClose?.();

      setForm({
        title: "",
        author: "",
        isbn: "",
        category: "",
        publisher: "",
        publication: "",
        edition: "",
        shelf_number: "",
        description: "",
        quantity: 1,
        published_date: "",
      });
      setCoverImage(null);
      setCoverPreview(null);
    } catch (err) {
      console.error("AddBook error:", err.response?.data || err.message);
      toast.error("Failed to add book. Check required fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start py-8 z-50 overflow-y-auto">
      {loading && <Loader overlay />}
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-700">➕ Add New Book</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="title" placeholder="Title *" value={form.title} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />
            <input name="author" placeholder="Author *" value={form.author} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />
            <input name="isbn" placeholder="ISBN" value={form.isbn} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />

            <select name="category" value={form.category} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2">
              <option value="">Select Category *</option>
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <input name="publisher" placeholder="Publisher" value={form.publisher} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />
            <input name="publication" placeholder="Publication" value={form.publication} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />
            <input name="edition" placeholder="Edition" value={form.edition} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />
            <input name="shelf_number" placeholder="Shelf / Location" value={form.shelf_number} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />
            <input type="number" name="quantity" min="1" value={form.quantity} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />
            <input type="date" name="published_date" value={form.published_date} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2" />
          </div>

          <textarea name="description" placeholder="Description / Summary" value={form.description} onChange={handleChange} rows="3" className="w-full border border-gray-300 rounded-lg px-3 py-2"></textarea>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <label className="block text-gray-600 font-medium mb-1">Cover Image:</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="border border-gray-300 rounded-lg px-3 py-2 w-full" />
            </div>
            {coverPreview && (
              <div className="flex-shrink-0">
                <img src={coverPreview} alt="Preview" className="w-24 h-32 object-cover rounded-lg border" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" disabled={loading} className={`px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}>
              {loading ? "Adding..." : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
