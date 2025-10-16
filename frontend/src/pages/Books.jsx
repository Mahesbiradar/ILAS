import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const Books = () => {
  const API_URL = "http://127.0.0.1:8000/api/books/";

  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    quantity: 1,
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
          console.log("Books fetched:", res.data);

      setBooks(res.data);
    } catch (err) {
      console.error("Error fetching books:", err);
      toast.error("Failed to load books. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editId) {
        await axios.patch(`${API_URL}${editId}/`, formData);
        toast.success("📘 Book updated successfully!");
      } else {
        await axios.post(API_URL, formData);
        toast.success("✅ Book added successfully!");
      }

      setFormData({
        title: "",
        author: "",
        isbn: "",
        category: "",
        quantity: 1,
      });
      setEditId(null);
      fetchBooks();
    } catch (err) {
      toast.error("Failed to save book. Check required fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      quantity: book.quantity,
    });
    setEditId(book.book_id || book.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await axios.delete(`${API_URL}${id}/`);
      toast.success("🗑️ Book deleted successfully!");
      fetchBooks();
    } catch (err) {
      toast.error("Failed to delete book.");
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({
      title: "",
      author: "",
      isbn: "",
      category: "",
      quantity: 1,
    });
  };

  return (
    <div className="w-full px-4 md:px-8 lg:px-16 py-6">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-6">
        📚 Library Book Management
      </h1>

      {/* Book Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-4 md:p-6 mb-6 border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            name="title"
            placeholder="Book Title"
            value={formData.title}
            onChange={handleChange}
            required
            className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            name="author"
            placeholder="Author"
            value={formData.author}
            onChange={handleChange}
            required
            className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            name="isbn"
            placeholder="ISBN"
            value={formData.isbn}
            onChange={handleChange}
            required
            className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            required
            className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            required
            className="border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex gap-3 justify-end mt-3">
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2 text-white rounded-md transition font-semibold ${
              editId
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading
              ? "Saving..."
              : editId
              ? "Update Book ✏️"
              : "Add Book ➕"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-5 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Book List */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-100 overflow-x-auto">
        {loading ? (
          <p className="text-center p-6 text-gray-500">Loading...</p>
        ) : books.length > 0 ? (
          <table className="w-full border-collapse">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                <th className="p-3 border text-left">#</th>
                <th className="p-3 border text-left">Title</th>
                <th className="p-3 border text-left">Author</th>
                <th className="p-3 border text-left">ISBN</th>
                <th className="p-3 border text-left">Category</th>
                <th className="p-3 border text-center">Qty</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, index) => (
                <tr
                  key={book.book_id || book.id}
                  className="hover:bg-gray-50 transition-all"
                >
                  <td className="p-3 border">{index + 1}</td>
                  <td className="p-3 border font-semibold">{book.title}</td>
                  <td className="p-3 border">{book.author}</td>
                  <td className="p-3 border">{book.isbn}</td>
                  <td className="p-3 border">{book.category}</td>
                  <td className="p-3 border text-center">{book.quantity}</td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() => handleEdit(book)}
                      className="text-yellow-600 hover:text-yellow-700 font-semibold mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(book.book_id || book.id)}
                      className="text-red-600 hover:text-red-700 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 py-6">No books found.</p>
        )}
      </div>
    </div>
  );
};

export default Books;
