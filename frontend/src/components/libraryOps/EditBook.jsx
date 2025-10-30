import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { updateBook } from "../../api/libraryApi";

export default function EditBook({ book, onSubmit, onClose }) {
  const [form, setForm] = useState(book || {});
  const [newCover, setNewCover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(book?.cover_image || null);

  useEffect(() => {
    setForm(book || {});
    setPreview(book?.cover_image || null);
  }, [book]);

  if (!book) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      toast.error("Title and Author are required!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v || ""));
      if (newCover) formData.append("cover_image", newCover);

      await updateBook(form.book_id, formData);
      toast.success("✅ Book updated successfully.");
      onSubmit && onSubmit();
      onClose && onClose();
    } catch (err) {
      console.error("Error updating book:", err);
      toast.error("Failed to update book.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-yellow-700">✏️ Edit Book</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grid of fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={form.title || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              name="author"
              placeholder="Author"
              value={form.author || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              name="isbn"
              placeholder="ISBN"
              value={form.isbn || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={form.category || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              name="publisher"
              placeholder="Publisher"
              value={form.publisher || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              name="publication"
              placeholder="Publication"
              value={form.publication || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              name="edition"
              placeholder="Edition"
              value={form.edition || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="text"
              name="shelf_number"
              placeholder="Shelf / Location"
              value={form.shelf_number || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="number"
              name="quantity"
              min="1"
              value={form.quantity || 1}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="date"
              name="published_date"
              value={form.published_date || ""}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Description */}
          <textarea
            name="description"
            placeholder="Description / Summary"
            value={form.description || ""}
            onChange={handleChange}
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          ></textarea>

          {/* Cover Image Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <label className="block text-gray-600 font-medium mb-1">
                Cover Image:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full"
              />
            </div>

            {preview && (
              <div className="flex-shrink-0">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-24 h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
