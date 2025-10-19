// src/components/libraryOps/AddBook.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function AddBook({ onAdd }) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    quantity: 1,
    publication: "",
    edition: "",
    shelf_number: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.author) {
      toast.error("Please fill all required fields");
      return;
    }
    onAdd(form);
    toast.success(`Book "${form.title}" added successfully!`);
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
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 border border-gray-100 mb-8"
    >
      <h2 className="text-lg font-semibold text-blue-700 mb-4">
        ➕ Add New Book
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          "title",
          "author",
          "isbn",
          "category",
          "publication",
          "edition",
          "shelf_number",
        ].map((field) => (
          <input
            key={field}
            name={field}
            placeholder={field.replace("_", " ").toUpperCase()}
            value={form[field]}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        ))}
        <input
          type="number"
          name="quantity"
          value={form.quantity}
          min="1"
          onChange={handleChange}
          className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <button
        type="submit"
        className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Add Book
      </button>
    </form>
  );
}
