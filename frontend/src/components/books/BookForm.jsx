import React, { useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function BookForm({ refreshBooks, editingBook = null }) {
  const [form, setForm] = useState(
    editingBook || {
      title: "",
      author: "",
      isbn: "",
      category: "",
      quantity: 1,
      publication: "",
      edition: "",
      shelf_number: "",
    }
  );
  const [cover, setCover] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => setCover(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        formData.append(key, value)
      );
      if (cover) formData.append("cover_image", cover);

      if (form.book_id) {
        await api.patch(`books/${form.book_id}/`, formData);
        toast.success("📘 Book updated successfully!");
      } else {
        await api.post("books/", formData);
        toast.success("✅ Book added successfully!");
      }
      setForm({
        title: "",
        author: "",
        isbn: "",
        category: "",
        quantity: 1,
        publication: "",
        edition: "",
        shelf_number: "",
      });
      setCover(null);
      refreshBooks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save book. Check required fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-6 border border-gray-100"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {["title", "author", "isbn", "category", "publication", "edition", "shelf_number"].map(
          (field) => (
            <input
              key={field}
              name={field}
              placeholder={field.replace("_", " ").toUpperCase()}
              value={form[field]}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          )
        )}
        <input
          type="number"
          name="quantity"
          min="1"
          value={form.quantity}
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="file"
          name="cover_image"
          accept="image/*"
          onChange={handleFileChange}
          className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        disabled={loading}
        className={`px-6 py-2 text-white rounded-md transition ${
          form.book_id
            ? "bg-yellow-500 hover:bg-yellow-600"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading
          ? "Saving..."
          : form.book_id
          ? "Update Book"
          : "Add Book"}
      </button>
    </form>
  );
}
