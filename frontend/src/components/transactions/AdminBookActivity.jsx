import React, { useEffect, useState } from "react";
import { getBooks } from "../../api/libraryApi";
import Loader from "../common/Loader";
import toast from "react-hot-toast";
import { RefreshCcw, BookOpen, Edit3, Trash2, PlusCircle } from "lucide-react";

export default function AdminBookActivity() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchBookActivity();
  }, []);

  const fetchBookActivity = async () => {
    try {
      setLoading(true);
      const data = await getBooks();
      // Sort by added_date descending for recent actions
      const sorted = [...data].sort(
        (a, b) => new Date(b.added_date) - new Date(a.added_date)
      );
      setBooks(sorted);
    } catch (err) {
      console.error("Error fetching book activity:", err);
      toast.error("Failed to load book activity.");
    } finally {
      setLoading(false);
    }
  };

  const getActionType = (book) => {
    // We can detect type of action if future "last_modified" or audit data added
    // For now, assume recently added = "Added", older entries = "Existing"
    const addedDaysAgo =
      (Date.now() - new Date(book.added_date)) / (1000 * 60 * 60 * 24);
    if (addedDaysAgo < 1) return "Added";
    return "Existing";
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "Added":
        return <PlusCircle className="w-4 h-4 text-green-600" />;
      case "Edited":
        return <Edit3 className="w-4 h-4 text-yellow-600" />;
      case "Deleted":
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-blue-600" />;
    }
  };

  // Filtered list
  const filteredBooks = books.filter(
    (b) =>
      (filter === "all" || getActionType(b).toLowerCase() === filter) &&
      b.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
          🧾 Book Add/Edit/Delete Activity
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search book..."
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="added">Added</option>
            <option value="edited">Edited</option>
            <option value="deleted">Deleted</option>
          </select>

          <button
            onClick={fetchBookActivity}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md flex items-center gap-1"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredBooks.length > 0 ? (
        <table className="w-full border-collapse text-sm">
          <thead className="bg-blue-50 text-blue-800">
            <tr>
              <th className="p-3 border text-left">#</th>
              <th className="p-3 border text-left">Action</th>
              <th className="p-3 border text-left">Book Title</th>
              <th className="p-3 border text-left">Author</th>
              <th className="p-3 border text-left">Category</th>
              <th className="p-3 border text-left">Added Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book, index) => {
              const action = getActionType(book);
              const icon = getActionIcon(action);
              return (
                <tr
                  key={book.book_id}
                  className="hover:bg-gray-50 transition border-b"
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 flex items-center gap-2 text-gray-700 font-medium">
                    {icon}
                    {action}
                  </td>
                  <td className="p-3 text-gray-800">{book.title}</td>
                  <td className="p-3 text-gray-600">{book.author}</td>
                  <td className="p-3 text-gray-600">{book.category}</td>
                  <td className="p-3 text-gray-500">
                    {new Date(book.added_date).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-center mt-4">No book activity found.</p>
      )}
    </div>
  );
}
