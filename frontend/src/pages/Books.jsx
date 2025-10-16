import React, { useEffect, useState } from "react";
import axios from "axios";

const Books = () => {
  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    published_date: "",
  });

  // Fetch books on load
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/books/");
      setBooks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/books/", formData);
      fetchBooks(); // refresh list
      setFormData({ title: "", author: "", published_date: "" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📚 Book List</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          className="border p-2 mr-2"
          required
        />
        <input
          type="text"
          name="author"
          placeholder="Author"
          value={formData.author}
          onChange={handleChange}
          className="border p-2 mr-2"
          required
        />
        <input
          type="date"
          name="published_date"
          value={formData.published_date}
          onChange={handleChange}
          className="border p-2 mr-2"
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Book
        </button>
      </form>

      <ul>
        {books.map((book) => (
          <li key={book.id} className="border-b py-2">
            <strong>{book.title}</strong> — {book.author} ({book.published_date})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Books;
